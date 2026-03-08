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
    { params }: { params: Promise<{ courseId: string }> }
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

        const livestreams = await db.livestream.findMany({
            where: { courseId: resolvedParams.courseId },
            orderBy: { position: "asc" },
        });

        return NextResponse.json(livestreams);
    } catch (error) {
        console.log("[LIVESTREAMS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const { userId, user } = await auth();
        const resolvedParams = await params;
        const body = await req.json();
        const { title, description, meetingLink, scheduledAt, expiresAt } = body;

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

        if (!title?.trim()) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }
        if (!meetingLink?.trim()) {
            return NextResponse.json({ error: "Meeting link is required" }, { status: 400 });
        }
        if (!scheduledAt) {
            return NextResponse.json({ error: "Scheduled at is required" }, { status: 400 });
        }
        if (!expiresAt) {
            return NextResponse.json({ error: "Expires at is required" }, { status: 400 });
        }

        const last = await db.livestream.findFirst({
            where: { courseId: resolvedParams.courseId },
            orderBy: { position: "desc" },
        });
        const position = last ? last.position + 1 : 1;

        const livestream = await db.livestream.create({
            data: {
                courseId: resolvedParams.courseId,
                title: title.trim(),
                description: description?.trim() || null,
                meetingLink: meetingLink.trim(),
                scheduledAt: new Date(scheduledAt),
                expiresAt: new Date(expiresAt),
                position,
            },
        });

        return NextResponse.json(livestream);
    } catch (error) {
        console.log("[LIVESTREAMS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
