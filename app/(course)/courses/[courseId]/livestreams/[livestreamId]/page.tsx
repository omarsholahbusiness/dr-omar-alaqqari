"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radio, ExternalLink, Lock, ShoppingCart } from "lucide-react";

interface Livestream {
    id: string;
    title: string;
    description: string | null;
    meetingLink: string;
    scheduledAt: string;
    expiresAt: string;
    isPublished: boolean;
}

const LivestreamDetailPage = () => {
    const router = useRouter();
    const params = useParams();
    const courseId = params.courseId as string;
    const livestreamId = params.livestreamId as string;

    const [livestream, setLivestream] = useState<Livestream | null>(null);
    const [loading, setLoading] = useState(true);
    const [purchaseRequired, setPurchaseRequired] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/courses/${courseId}/livestreams/${livestreamId}`);
                if (!res.ok) {
                    if (res.status === 403) {
                        const body = await res.json().catch(() => ({}));
                        if (body.error === "PURCHASE_REQUIRED") {
                            setPurchaseRequired(true);
                            setLoading(false);
                            return;
                        }
                    }
                    router.replace(`/courses/${courseId}`);
                    return;
                }
                const data = await res.json();
                setLivestream(data);
            } catch {
                router.replace(`/courses/${courseId}`);
            } finally {
                setLoading(false);
            }
        })();
    }, [courseId, livestreamId, router]);

    const formatDateTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleString("ar-EG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                <p className="mt-4 text-muted-foreground">جاري تحميل البث المباشر...</p>
            </div>
        );
    }

    if (purchaseRequired) {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="rounded-full bg-amber-100 dark:bg-amber-900/40 p-4">
                                <Lock className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-amber-900 dark:text-amber-100">
                                    يجب شراء الكورس أولاً
                                </h2>
                                <p className="mt-2 text-amber-800 dark:text-amber-200 text-sm">
                                    لم تشترِ هذا الكورس بعد. يرجى شراء الكورس للوصول إلى البث المباشر وباقي المحتوى.
                                </p>
                            </div>
                            <Button asChild className="bg-brand hover:bg-brand/90 text-white mt-2">
                                <Link href={`/courses/${courseId}/purchase`}>
                                    <ShoppingCart className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                                    شراء الكورس
                                </Link>
                            </Button>
                            <Button variant="ghost" asChild>
                                <Link href={`/courses/${courseId}`}>العودة إلى الكورس</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!livestream) {
        return null;
    }

    const now = new Date();
    const expired = new Date(livestream.expiresAt) < now;

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-3">
                        <Radio className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">{livestream.title}</h1>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline">بث مباشر</Badge>
                            {expired && (
                                <Badge variant="destructive">انتهى البث</Badge>
                            )}
                        </div>
                    </div>
                </div>
                {livestream.description && (
                    <p className="text-muted-foreground text-sm rtl:text-right ltr:text-left">
                        {livestream.description}
                    </p>
                )}
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <h2 className="text-sm font-medium text-muted-foreground">الجدول الزمني</h2>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div>
                        <span className="text-xs text-muted-foreground">مجدول في:</span>
                        <p className="font-medium rtl:text-right ltr:text-left">{formatDateTime(livestream.scheduledAt)}</p>
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground">ينتهي في:</span>
                        <p className="font-medium rtl:text-right ltr:text-left">{formatDateTime(livestream.expiresAt)}</p>
                    </div>
                </CardContent>
            </Card>

            {expired ? (
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="pt-6">
                        <h3 className="font-semibold text-destructive">انتهى البث المباشر</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            انتهت هذه الجلسة المباشرة.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground mb-4">
                            انقر على الزر أدناه للانضمام إلى الجلسة المباشرة.
                        </p>
                        <Button
                            asChild
                            className="bg-brand hover:bg-brand/90 text-white"
                        >
                            <a
                                href={livestream.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                انضم الآن
                            </a>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default LivestreamDetailPage;
