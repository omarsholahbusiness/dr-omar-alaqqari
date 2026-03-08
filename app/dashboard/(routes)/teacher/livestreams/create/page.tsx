"use client";

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Radio } from "lucide-react";

interface Course {
    id: string;
    title: string;
}

function CreateLivestreamForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const courseIdFromUrl = searchParams.get("courseId");

    const [courses, setCourses] = useState<Course[]>([]);
    const [courseId, setCourseId] = useState(courseIdFromUrl || "");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [meetingLink, setMeetingLink] = useState("");
    const [scheduledAt, setScheduledAt] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const isAdmin = typeof window !== "undefined" && window.location.pathname.includes("/dashboard/admin/");
    const listPath = isAdmin ? "/dashboard/admin/livestreams" : "/dashboard/teacher/livestreams";

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/teacher/courses");
                if (res.ok) {
                    const data = await res.json();
                    setCourses(data);
                    if (courseIdFromUrl && !courseId) setCourseId(courseIdFromUrl);
                }
            } catch (e) {
                console.error(e);
            }
        })();
    }, [courseIdFromUrl]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!courseId?.trim()) {
            toast.error("يرجى اختيار الكورس");
            return;
        }
        if (!title?.trim()) {
            toast.error("يرجى إدخال العنوان");
            return;
        }
        if (!meetingLink?.trim()) {
            toast.error("يرجى إدخال رابط الاجتماع");
            return;
        }
        if (!scheduledAt) {
            toast.error("يرجى تحديد وقت البث");
            return;
        }
        if (!expiresAt) {
            toast.error("يرجى تحديد وقت انتهاء البث");
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(`/api/courses/${courseId}/livestreams`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || undefined,
                    meetingLink: meetingLink.trim(),
                    scheduledAt,
                    expiresAt,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error(err.error || "حدث خطأ");
                return;
            }
            const created = await res.json();
            toast.success("تم إنشاء البث المباشر");
            router.push(`/dashboard/teacher/courses/${courseId}/livestreams/${created.id}/edit`);
        } catch {
            toast.error("حدث خطأ");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Radio className="h-8 w-8" />
                    إنشاء بث مباشر
                </h1>
                <Button variant="outline" onClick={() => router.push(listPath)}>
                    إلغاء
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>إنشاء بث مباشر</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!courseIdFromUrl && (
                            <div className="space-y-2">
                                <Label>الكورس (مطلوب)</Label>
                                <Select value={courseId} onValueChange={setCourseId} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر الكورس..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>العنوان (مطلوب)</Label>
                            <Input
                                placeholder="مثال: جلسة أسئلة وأجوبة مباشرة"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>الوصف (اختياري)</Label>
                            <Textarea
                                placeholder="وصف اختياري للبث المباشر..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>رابط الاجتماع (مطلوب)</Label>
                            <Input
                                type="url"
                                placeholder="https://zoom.us/j/... أو https://meet.google.com/..."
                                value={meetingLink}
                                onChange={(e) => setMeetingLink(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>مجدول في (مطلوب)</Label>
                                <Input
                                    type="datetime-local"
                                    value={scheduledAt}
                                    onChange={(e) => setScheduledAt(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>ينتهي في (مطلوب)</Label>
                                <Input
                                    type="datetime-local"
                                    value={expiresAt}
                                    onChange={(e) => setExpiresAt(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => router.push(listPath)}>
                                إلغاء
                            </Button>
                            <Button type="submit" disabled={submitting} className="bg-brand hover:bg-brand/90 text-white">
                                {submitting ? "جاري الإنشاء..." : "إنشاء البث المباشر"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function CreateLivestreamPage() {
    return (
        <Suspense fallback={
            <div className="p-6 flex items-center justify-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
        }>
            <CreateLivestreamForm />
        </Suspense>
    );
}
