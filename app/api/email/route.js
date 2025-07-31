import { NextResponse } from "next/server";
import ConnectDB from "../../../lib/db";
import EmailModel from "../../../lib/models/EmailModels";


// POST /api/email
export async function POST(request) {
  try {
    await ConnectDB();

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, msg: "Email is required" }, { status: 400 });
    }

    await EmailModel.create({ email });
    return NextResponse.json({ success: true, msg: "Email Subscribed" });
  } catch (error) {
    console.error("Error subscribing email:", error);
    return NextResponse.json({ success: false, msg: "Subscription failed" }, { status: 500 });
  }
}

// GET /api/email
export async function GET() {
  try {
    await ConnectDB();
    const emails = await EmailModel.find().sort({ date: -1 });
    return NextResponse.json({ success: true, emails });
  } catch (error) {
    console.error("Error fetching emails:", error);
    return NextResponse.json({ success: false, emails: [] }, { status: 500 });
  }
}

// DELETE /api/email?id=xxxx
export async function DELETE(request) {
  try {
    await ConnectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ success: false, msg: "ID is missing" }, { status: 400 });

    await EmailModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true, msg: "Email Deleted" });
  } catch (error) {
    console.error("Error deleting email:", error);
    return NextResponse.json({ success: false, msg: "Failed to delete" }, { status: 500 });
  }
}
