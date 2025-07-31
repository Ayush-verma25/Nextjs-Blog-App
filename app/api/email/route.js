import { NextResponse } from "next/server";
import ConnectDB from "../../../lib/config/db";
import EmailModel from "../../../lib/models/EmailModels";

// POST
export async function POST(request) {
  try {
    await ConnectDB();
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, msg: "Email is required" }, { status: 400 });
    }

    const exists = await EmailModel.findOne({ email });
    if (exists) {
      return NextResponse.json({ success: false, msg: "Email already subscribed" }, { status: 409 });
    }

    await EmailModel.create({ email });
    return NextResponse.json({ success: true, msg: "Email Subscribed" }, { status: 201 });
  } catch (err) {
    console.error("POST /api/email error:", err);
    return NextResponse.json({ success: false, msg: "Server error" }, { status: 500 });
  }
}

// GET
export async function GET() {
  try {
    await ConnectDB();
    const emails = await EmailModel.find().sort({ date: -1 });
    return NextResponse.json({ success: true, emails });
  } catch (err) {
    console.error("GET /api/email error:", err);
    return NextResponse.json({ success: false, msg: "Server error", emails: [] }, { status: 500 });
  }
}

// DELETE
export async function DELETE(request) {
  try {
    await ConnectDB();
    const { searchParams } = new URL(request.url, "https://nextjs-blog-app-xi-tawny.vercel.app");
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ success: false, msg: "Missing ID" }, { status: 400 });

    const deleted = await EmailModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, msg: "Email not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, msg: "Email Deleted" });
  } catch (err) {
    console.error("DELETE /api/email error:", err);
    return NextResponse.json({ success: false, msg: "Server error" }, { status: 500 });
  }
}
