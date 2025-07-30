import { NextResponse } from "next.js/server";
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
    console.error("GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 });
  }
}

// API Endpoint for Uploading Blog
export async function POST(request) {
  try {
    console.log("POST request received");
    
    const formData = await request.formData();
    console.log("Form data received");
    
    const timestamp = Date.now();
    const image = formData.get("image");
    
    if (!image) {
      return NextResponse.json({ 
        success: false, 
        msg: "No image provided" 
      }, { status: 400 });
    }

    console.log("Image file:", image.name, "Size:", image.size);

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Process image
    const imageByteData = await image.arrayBuffer();
    const buffer = Buffer.from(imageByteData);
    const imagePath = path.join(uploadsDir, `${timestamp}_${image.name}`);
    
    await writeFile(imagePath, buffer);
    console.log("Image saved to:", imagePath);
    
    const imgUrl = `/${timestamp}_${image.name}`;

    const blogData = {
      title: formData.get("title"),
      description: formData.get("description"),
      category: formData.get("category"),
      author: formData.get("author"),
      image: imgUrl,
      authorImg: formData.get("authorImg"),
    };

    console.log("Blog data to save:", blogData);

    // Validate required fields
    if (!blogData.title || !blogData.description) {
      return NextResponse.json({ 
        success: false, 
        msg: "Title and description are required" 
      }, { status: 400 });
    }

    const savedBlog = await BlogModel.create(blogData);
    console.log("Blog saved successfully:", savedBlog._id);

    return NextResponse.json({ 
      success: true, 
      msg: "Blog Added Successfully",
      blog: savedBlog
    });

  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ 
      success: false, 
      msg: "Failed to add blog",
      error: error.message 
    }, { status: 500 });
  }
}

// API Endpoint to delete blog
export async function DELETE(request) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        msg: "Blog ID is required" 
      }, { status: 400 });
    }

    const blog = await BlogModel.findById(id);
    
    if (!blog) {
      return NextResponse.json({ 
        success: false, 
        msg: "Blog not found" 
      }, { status: 404 });
    }

    // Delete image file
    const imagePath = path.join(process.cwd(), "public", blog.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await BlogModel.findByIdAndDelete(id);
    
    return NextResponse.json({ 
      success: true, 
      msg: "Blog Deleted Successfully" 
    });

  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ 
      success: false, 
      msg: "Failed to delete blog",
      error: error.message 
    }, { status: 500 });
  }
}
