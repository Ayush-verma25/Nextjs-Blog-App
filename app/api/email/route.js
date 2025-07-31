// app/api/email/route.js
import { NextResponse } from "next/server";
import ConnectDB from "../../../lib/config/db";
import EmailModel from "../../../lib/models/EmailModels";

// POST /api/email
export async function POST(request) {
  try {
    console.log("POST /api/email called");
    
    // Connect to database first
    await ConnectDB();
    console.log("Database connected successfully");
    
    // Parse request body
    const body = await request.json();
    console.log("Request body:", body);
    
    const { email } = body;
    
    // Validate email
    if (!email) {
      console.log("Missing email in request body");
      return NextResponse.json(
        { success: false, msg: "Email is required" }, 
        { status: 400 }
      );
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("Invalid email format:", email);
      return NextResponse.json(
        { success: false, msg: "Invalid email format" }, 
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const existingEmail = await EmailModel.findOne({ email });
    if (existingEmail) {
      console.log("Email already exists:", email);
      return NextResponse.json(
        { success: false, msg: "Email already subscribed" }, 
        { status: 409 }
      );
    }
    
    // Create new email subscription
    const newEmail = await EmailModel.create({ email });
    console.log("Email saved successfully:", newEmail);
    
    return NextResponse.json({ 
      success: true, 
      msg: "Email Subscribed Successfully" 
    });
    
  } catch (err) {
    console.error("POST /api/email error:", err);
    console.error("Error stack:", err.stack);
    
    // Handle specific MongoDB errors
    if (err.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, msg: "Invalid email data" }, 
        { status: 400 }
      );
    }
    
    if (err.code === 11000) {
      return NextResponse.json(
        { success: false, msg: "Email already exists" }, 
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, msg: "Server error. Please try again later." }, 
      { status: 500 }
    );
  }
}

// GET /api/email
export async function GET() {
  try {
    console.log("GET /api/email called");
    await ConnectDB();
    
    const emails = await EmailModel.find().sort({ date: -1 });
    console.log(`Retrieved ${emails.length} emails`);
    
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
    console.log("DELETE /api/email called");
    await ConnectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { success: false, msg: "Missing ID parameter" }, 
        { status: 400 }
      );
    }
    
    // Check if the email exists before deleting
    const email = await EmailModel.findById(id);
    if (!email) {
      return NextResponse.json(
        { success: false, msg: "Email not found" }, 
        { status: 404 }
      );
    }
    
    await EmailModel.findByIdAndDelete(id);
    console.log(`Email with ID ${id} deleted successfully`);
    
    return NextResponse.json({ 
      success: true, 
      msg: "Email Deleted Successfully" 
    });
  } catch (err) {
    console.error("DELETE /api/email error:", err);
    return NextResponse.json(
      { success: false, msg: "Server error" }, 
      { status: 500 }
    );
  }
}
