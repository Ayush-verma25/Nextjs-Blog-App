// app/api/email/route.js
import { NextResponse } from "next/server";
import ConnectDB from "@/lib/config/db"; // Use alias if configured in tsconfig/jsconfig
import EmailModel from "@/lib/models/EmailModel";

// POST /api/email
export async function POST(request) {
  try {
    await ConnectDB();
    const body = await request.json();

    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, msg: "Email is required" },
        { status: 400 }
      );
    }

    const alreadyExists = await EmailModel.findOne({ email });
    if (alreadyExists) {
      return NextResponse.json(
        { success: false, msg: "Email already subscribed" },
        { status: 409 }
      );
    }

    const newEmail = await EmailModel.create({ email });

    return NextResponse.json({
      success: true,
      msg: "Email Subscribed",
      email: newEmail,
    });
  } catch (err) {
    console.error("POST /api/email error:", err);
    return NextResponse.json(
      { success: false, msg: "Server error" },
      { status: 500 }
    );
  }
}

// GET /api/email
export async function GET() {
  try {
    await ConnectDB();
    const emails = await EmailModel.find().sort({ date: -1 });
    return NextResponse.json({ success: true, emails });
  } catch (err) {
    console.error("GET /api/email error:", err);
    return NextResponse.json(
      { success: false, msg: "Server error", emails: [] },
      { status: 500 }
    );
  }
}

// DELETE /api/email?id=xxx
export async function DELETE(request) {
  try {
    await ConnectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, msg: "Missing ID" },
        { status: 400 }
      );
    }

    const deleted = await EmailModel.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, msg: "Email not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      msg: "Email Deleted",
    });
  } catch (err) {
    console.error("DELETE /api/email error:", err);
    return NextResponse.json(
      { success: false, msg: "Server error" },
      { status: 500 }
    );
  }
}
