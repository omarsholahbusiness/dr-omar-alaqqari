import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const { userId, user } = await auth();
        const resolvedParams = await params;
        const { list } = await req.json();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const course = await db.course.findUnique({
            where: { id: resolvedParams.courseId },
            select: { userId: true },
        });

        if (!course) {
            return new NextResponse("Not Found", { status: 404 });
        }

        const isOwnerOrAdmin = user?.role === "ADMIN" || course.userId === userId;
        if (!isOwnerOrAdmin) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const chapters = list.filter((item: { type: string }) => item.type === "chapter");
        const quizzes = list.filter((item: { type: string }) => item.type === "quiz");
        const livestreams = list.filter((item: { type: string }) => item.type === "livestream");

        for (const item of chapters) {
            await db.chapter.update({
                where: { id: item.id },
                data: { position: item.position }
            });
        }
        for (const item of quizzes) {
            await db.quiz.update({
                where: { id: item.id },
                data: { position: item.position }
            });
        }
        for (const item of livestreams) {
            await db.livestream.update({
                where: { id: item.id },
                data: { position: item.position }
            });
        }

        return new NextResponse("Success", { status: 200 });
    } catch (error) {
        console.log("[MIXED_REORDER]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
} 