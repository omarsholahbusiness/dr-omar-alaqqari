"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { Radio } from "lucide-react";

const CreateLivestreamFromCoursePage = () => {
    const router = useRouter();
    const params = useParams();
    const courseId = params.courseId as string;

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [meetingLink, setMeetingLink] = useState("");
    const [scheduledAt, setScheduledAt] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
                    إضافة بث مباشر للكورس
                </h1>
                <Button variant="outline" onClick={() => router.push(`/dashboard/teacher/courses/${courseId}`)}>
                    إلغاء
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>إنشاء بث مباشر</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
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
                            <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/teacher/courses/${courseId}`)}>
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
};

export default CreateLivestreamFromCoursePage;
