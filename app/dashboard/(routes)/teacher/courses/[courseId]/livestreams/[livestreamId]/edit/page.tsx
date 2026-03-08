"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { Radio, Trash2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Livestream {
    id: string;
    title: string;
    description: string | null;
    meetingLink: string;
    scheduledAt: string;
    expiresAt: string;
    position: number;
    isPublished: boolean;
    courseId: string;
}

const EditLivestreamPage = () => {
    const router = useRouter();
    const params = useParams();
    const courseId = params.courseId as string;
    const livestreamId = params.livestreamId as string;

    const [livestream, setLivestream] = useState<Livestream | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [meetingLink, setMeetingLink] = useState("");
    const [scheduledAt, setScheduledAt] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [isPublished, setIsPublished] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [togglingPublish, setTogglingPublish] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/courses/${courseId}/livestreams/${livestreamId}`);
                if (!res.ok) {
                    router.push(`/dashboard/teacher/courses/${courseId}`);
                    return;
                }
                const data = await res.json();
                setLivestream(data);
                setTitle(data.title);
                setDescription(data.description || "");
                setMeetingLink(data.meetingLink);
                setScheduledAt(data.scheduledAt ? new Date(data.scheduledAt).toISOString().slice(0, 16) : "");
                setExpiresAt(data.expiresAt ? new Date(data.expiresAt).toISOString().slice(0, 16) : "");
                setIsPublished(data.isPublished);
            } catch {
                router.push(`/dashboard/teacher/courses/${courseId}`);
            } finally {
                setLoading(false);
            }
        })();
    }, [courseId, livestreamId, router]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title?.trim()) {
            toast.error("يرجى إدخال العنوان");
            return;
        }
        if (!meetingLink?.trim()) {
            toast.error("يرجى إدخال رابط الاجتماع");
            return;
        }
        if (!scheduledAt || !expiresAt) {
            toast.error("يرجى تحديد وقت البث وانتهائه");
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(`/api/courses/${courseId}/livestreams/${livestreamId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || null,
                    meetingLink: meetingLink.trim(),
                    scheduledAt: new Date(scheduledAt).toISOString(),
                    expiresAt: new Date(expiresAt).toISOString(),
                }),
            });
            if (!res.ok) {
                toast.error("حدث خطأ");
                return;
            }
            const updated = await res.json();
            setLivestream(updated);
            toast.success("تم حفظ البث المباشر");
        } catch {
            toast.error("حدث خطأ");
        } finally {
            setSubmitting(false);
        }
    };

    const handleTogglePublish = async () => {
        setTogglingPublish(true);
        try {
            const res = await fetch(`/api/courses/${courseId}/livestreams/${livestreamId}/publish`, { method: "PATCH" });
            if (res.ok) {
                const updated = await res.json();
                setIsPublished(updated.isPublished);
                toast.success(updated.isPublished ? "تم نشر البث المباشر" : "تم إلغاء نشر البث المباشر");
            } else toast.error("حدث خطأ");
        } catch {
            toast.error("حدث خطأ");
        } finally {
            setTogglingPublish(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/courses/${courseId}/livestreams/${livestreamId}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("تم حذف البث المباشر");
                router.push(`/dashboard/teacher/courses/${courseId}`);
            } else toast.error("حدث خطأ");
        } catch {
            toast.error("حدث خطأ");
        } finally {
            setDeleting(false);
        }
    };

    if (loading || !livestream) {
        return (
            <div className="p-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Radio className="h-8 w-8" />
                    تعديل البث المباشر
                </h1>
                <div className="flex items-center gap-2">
                    <Button
                        variant={isPublished ? "outline" : "default"}
                        className={!isPublished ? "bg-brand hover:bg-brand/90 text-white" : ""}
                        disabled={togglingPublish}
                        onClick={handleTogglePublish}
                    >
                        {togglingPublish ? "..." : isPublished ? "إلغاء النشر" : "نشر"}
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={deleting}>
                                <Trash2 className="h-4 w-4" />
                                حذف
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>حذف البث المباشر</AlertDialogTitle>
                                <AlertDialogDescription>
                                    هل أنت متأكد من حذف هذا البث المباشر؟ لا يمكن التراجع عن هذا الإجراء.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                                    {deleting ? "جاري الحذف..." : "حذف"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>بيانات البث المباشر</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-4">
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
                                placeholder="وصف اختياري..."
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
                            <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/teacher/courses/${courseId}`)}>
                                إلغاء
                            </Button>
                            <Button type="submit" disabled={submitting} className="bg-brand hover:bg-brand/90 text-white">
                                {submitting ? "جاري الحفظ..." : "حفظ"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default EditLivestreamPage;
