"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Chapter, Course, Quiz } from "@prisma/client";
import { Livestream } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { PlusCircle, Radio } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { CourseContentList } from "./course-content-list";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface CourseContentFormProps {
    initialData: Course & { chapters: Chapter[]; quizzes: Quiz[]; livestreams?: Livestream[] };
    courseId: string;
}

export const CourseContentForm = ({
    initialData,
    courseId
}: CourseContentFormProps) => {
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [title, setTitle] = useState("");

    const router = useRouter();

    const onCreate = async () => {
        try {
            setIsUpdating(true);
            await axios.post(`/api/courses/${courseId}/chapters`, { title });
            toast.success("تم انشاء الفصل");
            setTitle("");
            setIsCreating(false);
            router.refresh();
        } catch {
            toast.error("حدث خطأ");
        } finally {
            setIsUpdating(false);
        }
    }

    const onDelete = async (id: string, type: "chapter" | "quiz" | "livestream") => {
        try {
            setIsUpdating(true);
            if (type === "chapter") {
                await axios.delete(`/api/courses/${courseId}/chapters/${id}`);
                toast.success("تم حذف الفصل");
            } else if (type === "quiz") {
                await axios.delete(`/api/teacher/quizzes/${id}`);
                toast.success("تم حذف الاختبار");
            } else {
                await axios.delete(`/api/courses/${courseId}/livestreams/${id}`);
                toast.success("تم حذف البث المباشر");
            }
            router.refresh();
        } catch {
            toast.error("حدث خطأ");
        } finally {
            setIsUpdating(false);
        }
    }

    const onReorder = async (updateData: { id: string; position: number; type: "chapter" | "quiz" | "livestream" }[]) => {
        try {
            setIsUpdating(true);
            await axios.put(`/api/courses/${courseId}/reorder`, {
                list: updateData
            });
            toast.success("تم ترتيب المحتوى");
            router.refresh();
        } catch {
            toast.error("حدث خطأ");
        } finally {
            setIsUpdating(false);
        }
    }

    const onEdit = (id: string, type: "chapter" | "quiz" | "livestream") => {
        if (type === "chapter") {
            router.push(`/dashboard/teacher/courses/${courseId}/chapters/${id}`);
        } else if (type === "quiz") {
            router.push(`/dashboard/teacher/quizzes/${id}/edit`);
        } else {
            router.push(`/dashboard/teacher/courses/${courseId}/livestreams/${id}/edit`);
        }
    }

    const livestreams = initialData.livestreams ?? [];
    // Combine chapters, quizzes and livestreams for display
    const courseItems = [
        ...initialData.chapters.map(chapter => ({
            id: chapter.id,
            title: chapter.title,
            position: chapter.position,
            isPublished: chapter.isPublished,
            type: "chapter" as const,
            isFree: chapter.isFree
        })),
        ...initialData.quizzes.map(quiz => ({
            id: quiz.id,
            title: quiz.title,
            position: quiz.position,
            isPublished: quiz.isPublished,
            type: "quiz" as const
        })),
        ...livestreams.map(ls => ({
            id: ls.id,
            title: ls.title,
            position: ls.position,
            isPublished: ls.isPublished,
            type: "livestream" as const
        }))
    ].sort((a, b) => a.position - b.position);

    return (
        <div className="relative mt-6 border bg-card rounded-md p-4">
            {isUpdating && (
                <div className="absolute h-full w-full bg-background/50 top-0 right-0 rounded-m flex items-center justify-center">
                    <div className="animate-spin h-6 w-6 border-4 border-primary rounded-full border-t-transparent" />
                </div>
            )}
            <div className="font-medium flex items-center justify-between gap-4 flex-wrap">
                <h3 className="text-sm font-medium shrink-0">محتوى الكورس (فصول واختبارات وبثوث مباشرة)</h3>
                <div className="flex items-center gap-2 flex-nowrap shrink-0">
                    <Button onClick={() => router.push(`/dashboard/teacher/quizzes/create?courseId=${courseId}`)} variant="ghost" size="sm" className="whitespace-nowrap">
                        <PlusCircle className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                        إضافة اختبار
                    </Button>
                    <Button onClick={() => router.push(`/dashboard/teacher/courses/${courseId}/livestreams/create`)} variant="ghost" size="sm" className="whitespace-nowrap">
                        <Radio className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                        إضافة بث مباشر
                    </Button>
                    <Button onClick={() => setIsCreating((current) => !current)} variant="ghost" size="sm" className="whitespace-nowrap">
                        {isCreating ? (
                            <>إلغاء</>
                        ) : (
                            <>
                                <PlusCircle className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                                إضافة فصل
                            </>
                        )}
                    </Button>
                </div>
            </div>
            {isCreating && (
                <div className="mt-4 space-y-4">
                    <Input
                        disabled={isUpdating}
                        placeholder="e.g. 'المقدمة في الكورس'"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <Button
                        onClick={onCreate}
                        disabled={!title || isUpdating}
                        type="button"
                    >
                        انشاء
                    </Button>
                </div>
            )}
            {!isCreating && (
                <div className={cn(
                    "text-sm mt-2",
                    !courseItems.length && "text-muted-foreground italic"
                )}>
                    {!courseItems.length && "لا يوجد محتوى. أضف فصولاً أو اختبارات أو بثوثاً مباشرة."}
                    <CourseContentList
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onReorder={onReorder}
                        items={courseItems}
                    />
                </div>
            )}
            {!isCreating && courseItems.length > 0 && (
                <p className="text-xs text-muted-foreground mt-4">
                    قم بالسحب والإفلات لترتيب الفصول والاختبارات والبثوث المباشرة
                </p>
            )}
        </div>
    );
}; 