"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Edit, Trash2, Radio } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
    course: { id: string; title: string };
    createdAt: string;
    updatedAt: string;
}

const LivestreamsPage = () => {
    const router = useRouter();
    const [livestreams, setLivestreams] = useState<Livestream[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [togglingPublish, setTogglingPublish] = useState<string | null>(null);

    const fetchLivestreams = async () => {
        try {
            const response = await fetch("/api/teacher/livestreams");
            if (response.ok) {
                const data = await response.json();
                setLivestreams(data);
            }
        } catch (error) {
            console.error("Error fetching livestreams:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLivestreams();
    }, []);

    const handleDelete = async (ls: Livestream) => {
        if (!confirm("هل أنت متأكد من حذف هذا البث المباشر؟")) return;
        setIsDeleting(ls.id);
        try {
            const res = await fetch(`/api/courses/${ls.courseId}/livestreams/${ls.id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("تم حذف البث المباشر");
                fetchLivestreams();
            } else toast.error("حدث خطأ أثناء الحذف");
        } catch {
            toast.error("حدث خطأ أثناء الحذف");
        } finally {
            setIsDeleting(null);
        }
    };

    const handleTogglePublish = async (ls: Livestream) => {
        setTogglingPublish(ls.id);
        try {
            const res = await fetch(`/api/courses/${ls.courseId}/livestreams/${ls.id}/publish`, { method: "PATCH" });
            if (res.ok) {
                const updated = await res.json();
                toast.success(updated.isPublished ? "تم نشر البث المباشر" : "تم إلغاء نشر البث المباشر");
                fetchLivestreams();
            } else toast.error("حدث خطأ");
        } catch {
            toast.error("حدث خطأ");
        } finally {
            setTogglingPublish(null);
        }
    };

    const filtered = livestreams.filter(
        (ls) =>
            ls.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ls.course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDateTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" });
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center">جاري التحميل...</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Radio className="h-8 w-8" />
                    البثوث المباشرة
                </h1>
                <Button
                    onClick={() => router.push("/dashboard/teacher/livestreams/create")}
                    className="bg-brand hover:bg-brand/90 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة بث مباشر
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>قائمة البثوث المباشرة</CardTitle>
                    <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="البحث بالعنوان أو الكورس..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {filtered.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">لا توجد بثوث مباشرة.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">العنوان</TableHead>
                                    <TableHead className="text-right">الكورس</TableHead>
                                    <TableHead className="text-right">مجدول في</TableHead>
                                    <TableHead className="text-right">ينتهي في</TableHead>
                                    <TableHead className="text-right">الحالة</TableHead>
                                    <TableHead className="text-right">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((ls) => {
                                    const now = new Date();
                                    const expired = new Date(ls.expiresAt) < now;
                                    return (
                                        <TableRow key={ls.id}>
                                            <TableCell className="font-medium">{ls.title}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{ls.course.title}</Badge>
                                            </TableCell>
                                            <TableCell>{formatDateTime(ls.scheduledAt)}</TableCell>
                                            <TableCell>{formatDateTime(ls.expiresAt)}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    <Badge variant={ls.isPublished ? "default" : "secondary"}>
                                                        {ls.isPublished ? "منشور" : "مسودة"}
                                                    </Badge>
                                                    {expired && (
                                                        <Badge variant="destructive">انتهى البث</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            router.push(
                                                                `/dashboard/teacher/courses/${ls.courseId}/livestreams/${ls.id}/edit`
                                                            )
                                                        }
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                        تعديل
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant={ls.isPublished ? "outline" : "default"}
                                                        className={!ls.isPublished ? "bg-brand hover:bg-brand/90 text-white" : ""}
                                                        disabled={togglingPublish === ls.id}
                                                        onClick={() => handleTogglePublish(ls)}
                                                    >
                                                        {togglingPublish === ls.id
                                                            ? "..."
                                                            : ls.isPublished
                                                            ? "إلغاء النشر"
                                                            : "نشر"}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleDelete(ls)}
                                                        disabled={isDeleting === ls.id}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        {isDeleting === ls.id ? "جاري الحذف..." : "حذف"}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default LivestreamsPage;
