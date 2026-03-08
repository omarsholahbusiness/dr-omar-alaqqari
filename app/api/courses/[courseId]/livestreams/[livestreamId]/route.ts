import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function isCourseOwnerOrAdmin(course: { userId: string } | null, userId: string | undefined, role: string | undefined) {
    if (!userId) return false;
    if (role === "ADMIN") return true;
    return course?.userId === userId;
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ courseId: string; livestreamId: string }> }
) {
    try {
        const { userId, user } = await auth();
        const resolvedParams = await params;

        const livestream = await db.livestream.findUnique({
            where: {
                id: resolvedParams.livestreamId,
                courseId: resolvedParams.courseId,
            },
        });

        if (!livestream) {
            return new NextResponse("Not Found", { status: 404 });
        }

        const course = await db.course.findUnique({
            where: { id: resolvedParams.courseId },
            select: { userId: true },
        });

        if (!course) {
            return new NextResponse("Not Found", { status: 404 });
        }

        const isOwnerOrAdmin = isCourseOwnerOrAdmin(course, userId, user?.role);

        if (isOwnerOrAdmin) {
            return NextResponse.json(livestream);
        }

        // Student: only published livestreams and must have course access
        if (!livestream.isPublished) {
            return new NextResponse("Not Found", { status: 404 });
        }

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const purchase = await db.purchase.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId: resolvedParams.courseId,
                },
            },
        });

        if (!purchase || purchase.status !== "ACTIVE") {
            return NextResponse.json(
                {
                    error: "PURCHASE_REQUIRED",
                    message: "يجب شراء الكورس أولاً للوصول إلى هذا البث المباشر.",
                },
                { status: 403 }
            );
        }

        return NextResponse.json(livestream);
    } catch (error) {
        console.log("[LIVESTREAM_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ courseId: string; livestreamId: string }> }
) {
    try {
        const { userId, user } = await auth();
        const resolvedParams = await params;
        const body = await req.json();

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

        const existing = await db.livestream.findUnique({
            where: {
                id: resolvedParams.livestreamId,
                courseId: resolvedParams.courseId,
            },
        });

        if (!existing) {
            return new NextResponse("Not Found", { status: 404 });
        }

        const data: Record<string, unknown> = {};
        if (body.title !== undefined) data.title = body.title?.trim() ?? existing.title;
        if (body.description !== undefined) data.description = body.description?.trim() || null;
        if (body.meetingLink !== undefined) data.meetingLink = body.meetingLink?.trim() ?? existing.meetingLink;
        if (body.scheduledAt !== undefined) data.scheduledAt = new Date(body.scheduledAt);
        if (body.expiresAt !== undefined) data.expiresAt = new Date(body.expiresAt);
        if (body.isPublished !== undefined) data.isPublished = !!body.isPublished;

        const updated = await db.livestream.update({
            where: {
                id: resolvedParams.livestreamId,
                courseId: resolvedParams.courseId,
            },
            data,
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.log("[LIVESTREAM_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
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

        await db.livestream.delete({
            where: {
                id: resolvedParams.livestreamId,
                courseId: resolvedParams.courseId,
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.log("[LIVESTREAM_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
