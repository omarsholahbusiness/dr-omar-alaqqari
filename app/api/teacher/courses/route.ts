import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const { userId, user } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const isAdmin = user?.role === "ADMIN";
        const courses = await db.course.findMany({
            where: isAdmin ? {} : { userId },
            select: { id: true, title: true },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(courses);
    } catch (error) {
        console.log("[TEACHER_COURSES]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
