import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function isCourseOwnerOrAdmin(course: { userId: string } | null, userId: string | undefined, role: string | undefined) {
    if (!userId) return false;
    if (role === "ADMIN") return true;
    return course?.userId === userId;
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ courseId: string; livestreamId: string }> }
) {
    try {
        const { userId, user } = await auth();
        const resolvedParams = await params;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const course = await db.course.findUnique({
            where: { id: resolvedParams.courseId },
            select: { id: true, userId: true },
        });

        if (!course) {
            return new NextResponse("Not Found", { status: 404 });
        }

        if (!isCourseOwnerOrAdmin(course, userId, user?.role)) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const livestream = await db.livestream.findUnique({
            where: {
                id: resolvedParams.livestreamId,
                courseId: resolvedParams.courseId,
            },
        });

        if (!livestream) {
            return new NextResponse("Not Found", { status: 404 });
        }

        const updated = await db.livestream.update({
            where: {
                id: resolvedParams.livestreamId,
                courseId: resolvedParams.courseId,
            },
            data: { isPublished: !livestream.isPublished },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.log("[LIVESTREAM_PUBLISH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
