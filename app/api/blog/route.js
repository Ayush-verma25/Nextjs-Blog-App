import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { ConnectDB } from "../../../lib/config/db";
import BlogModel from "../../../lib/models/BlogModels";
import fs from "fs";
import path from "path";

const LoadDB = async () => {
  await ConnectDB();
};

LoadDB();

// API Endpoint to get all blogs
export async function GET(request) {
  try {
    const blogId = request.nextUrl.searchParams.get("id");
    if (blogId) {
      const blog = await BlogModel.findById(blogId);
      return NextResponse.json({ blog });
    } else {
      const blogs = await BlogModel.find({});
      return NextResponse.json({ blogs });
    }
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 });
  }
}

// API Endpoint for Uploading Blog
export async function POST(request) {
  try {
    const formData = await request.formData();
    const timestamp = Date.now();

    const image = formData.get("image");
    
    // Validate image
    if (!image || image.size === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "No image provided" 
      }, { status: 400 });
    }

    const imageByteData = await image.arrayBuffer();
    const buffer = Buffer.from(imageByteData);
    
    // Create public directory if it doesn't exist
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    const imagePath = path.join(publicDir, `${timestamp}_${image.name}`);
    await writeFile(imagePath, buffer);
    const imgUrl = `/${timestamp}_${image.name}`;

    const blogData = {
      title: formData.get("title"),
      description: formData.get("description"),
      category: formData.get("category"),
      author: formData.get("author"),
      image: imgUrl,
      authorImg: formData.get("authorImg"),
    };

    // Validate required fields
    if (!blogData.title || !blogData.description) {
      return NextResponse.json({ 
        success: false, 
        error: "Title and description are required" 
      }, { status: 400 });
    }

    await BlogModel.create(blogData);
    console.log("Blog saved successfully");

    return NextResponse.json({ 
      success: true, 
      msg: "Blog Added Successfully" 
    });

  } catch (error) {
    console.error("Error creating blog:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create blog" 
    }, { status: 500 });
  }
}

// API Endpoint to delete blog
export async function DELETE(request) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ 
        error: "Blog ID is required" 
      }, { status: 400 });
    }

    const blog = await BlogModel.findById(id);
    
    if (!blog) {
      return NextResponse.json({ 
        error: "Blog not found" 
      }, { status: 404 });
    }

    // Delete image file
    const imagePath = path.join(process.cwd(), 'public', blog.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await BlogModel.findByIdAndDelete(id);
    
    return NextResponse.json({ 
      success: true, 
      msg: "Blog Deleted Successfully" 
    });

  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json({ 
      error: "Failed to delete blog" 
    }, { status: 500 });
  }
}
