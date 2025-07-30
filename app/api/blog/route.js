import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { ConnectDB } from "../../../lib/config/db";
import BlogModel from "../../../lib/models/BlogModels";
import fs from "fs";
import path from "path";

// API Endpoint to get all blogs
export async function GET(request) {
  try {
    await ConnectDB();
    
    const blogId = request.nextUrl.searchParams.get("id");
    if (blogId) {
      const blog = await BlogModel.findById(blogId);
      if (!blog) {
        return NextResponse.json({ error: "Blog not found" }, { status: 404 });
      }
      return NextResponse.json({ blog });
    } else {
      const blogs = await BlogModel.find({});
      return NextResponse.json({ blogs });
    }
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch blogs" 
    }, { status: 500 });
  }
}

// API Endpoint for Uploading Blog
export async function POST(request) {
  try {
    await ConnectDB();
    
    const formData = await request.formData();
    const timestamp = Date.now();

    const image = formData.get("image");
    
    // Validate image
    if (!image || !image.name || image.size === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "No valid image provided" 
      }, { status: 400 });
    }

    const imageByteData = await image.arrayBuffer();
    const buffer = Buffer.from(imageByteData);
    
    // Create public directory if it doesn't exist
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Sanitize filename
    const sanitizedFileName = image.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const imagePath = path.join(publicDir, `${timestamp}_${sanitizedFileName}`);
    await writeFile(imagePath, buffer);
    const imgUrl = `/${timestamp}_${sanitizedFileName}`;

    const blogData = {
      title: formData.get("title"),
      description: formData.get("description"),
      category: formData.get("category") || "General",
      author: formData.get("author") || "Anonymous",
      image: imgUrl,
      authorImg: formData.get("authorImg") || "/default-author.png",
    };

    // Validate required fields
    if (!blogData.title || !blogData.description) {
      return NextResponse.json({ 
        success: false, 
        error: "Title and description are required" 
      }, { status: 400 });
    }

    const newBlog = await BlogModel.create(blogData);
    console.log("Blog saved successfully:", newBlog._id);

    return NextResponse.json({ 
      success: true, 
      msg: "Blog Added Successfully",
      blog: newBlog
    });

  } catch (error) {
    console.error("Error creating blog:", error);
    
    // More specific error handling
    if (error.name === 'ValidationError') {
      return NextResponse.json({ 
        success: false, 
        error: "Validation error: " + error.message 
      }, { status: 400 });
    }
    
    if (error.code === 11000) {
      return NextResponse.json({ 
        success: false, 
        error: "Blog with this title already exists" 
      }, { status: 409 });
    }

    return NextResponse.json({ 
      success: false, 
      error: "Failed to create blog: " + error.message 
    }, { status: 500 });
  }
}

// API Endpoint to delete blog
export async function DELETE(request) {
  try {
    await ConnectDB();
    
    const id = request.nextUrl.searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ 
        success: false,
        error: "Blog ID is required" 
      }, { status: 400 });
    }

    const blog = await BlogModel.findById(id);
    
    if (!blog) {
      return NextResponse.json({ 
        success: false,
        error: "Blog not found" 
      }, { status: 404 });
    }

    // Delete image file if it exists
    if (blog.image) {
      const imagePath = path.join(process.cwd(), 'public', blog.image);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (fileError) {
          console.warn("Failed to delete image file:", fileError);
          // Continue with blog deletion even if file deletion fails
        }
      }
    }

    await BlogModel.findByIdAndDelete(id);
    
    return NextResponse.json({ 
      success: true, 
      msg: "Blog Deleted Successfully" 
    });

  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json({ 
      success: false,
      error: "Failed to delete blog: " + error.message 
    }, { status: 500 });
  }
}
