// app/api/email/route.js
import { NextResponse } from "next/server";
import ConnectDB from "../../../lib/config/db";
import EmailModel from "../../../lib/models/EmailModels";

// POST /api/email
export async function POST(request) {
  try {
    console.log("POST /api/email called");

    await ConnectDB();

    const body = await request.json();
    console.log("Request body:", body);

    const { email } = body;

    if (!email) {
      console.log("Missing email in request body");
      return NextResponse.json({ success: false, msg: "Email is required" }, { status: 400 });
    }

    const newEmail = await EmailModel.create({ email });
    console.log("Email saved:", newEmail);

    return NextResponse.json({ success: true, msg: "Email Subscribed" });
  } catch (err) {
    console.error("POST /api/email error:", err);
    return NextResponse.json({ success: false, msg: "Server error" }, { status: 500 });
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
    return NextResponse.json({ success: false, msg: "Server error", emails: [] }, { status: 500 });
  }
}

// DELETE /api/email?id=xxx
export async function DELETE(request) {
  try {
    await ConnectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, msg: "Missing ID" }, { status: 400 });
    }

    await EmailModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true, msg: "Email Deleted" });
  } catch (err) {
    console.error("DELETE /api/email error:", err);
    return NextResponse.json({ success: false, msg: "Server error" }, { status: 500 });
  }
}
