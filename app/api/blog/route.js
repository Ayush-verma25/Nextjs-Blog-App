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
      // Validate MongoDB ObjectId format
      if (!blogId.match(/^[0-9a-fA-F]{24}$/)) {
        return NextResponse.json({ 
          success: false,
          error: "Invalid blog ID format" 
        }, { status: 400 });
      }

      const blog = await BlogModel.findById(blogId);
      if (!blog) {
        return NextResponse.json({ 
          success: false,
          error: "Blog not found" 
        }, { status: 404 });
      }
      return NextResponse.json({ 
        success: true,
        blog 
      });
    } else {
      const blogs = await BlogModel.find({}).sort({ date: -1 });
      return NextResponse.json({ 
        success: true,
        blogs 
      });
    }
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch blogs",
      msg: "Database connection error"
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
        error: "No valid image provided",
        msg: "Please select an image"
      }, { status: 400 });
    }

    // File size validation (5MB max)
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json({ 
        success: false, 
        error: "File too large",
        msg: "Image size should be less than 5MB"
      }, { status: 400 });
    }

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid file type",
        msg: "Only JPEG, PNG, and WebP images are allowed"
      }, { status: 400 });
    }

    const imageByteData = await image.arrayBuffer();
    const buffer = Buffer.from(imageByteData);
    
    // Create public directory if it doesn't exist
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Sanitize filename and add extension if missing
    const fileExtension = path.extname(image.name) || '.jpg';
    const sanitizedFileName = image.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.(jpg|jpeg|png|webp)$/i, '') + fileExtension;
    
    const imagePath = path.join(publicDir, `${timestamp}_${sanitizedFileName}`);
    await writeFile(imagePath, buffer);
    const imgUrl = `/${timestamp}_${sanitizedFileName}`;

    // Get and validate form data
    const title = formData.get("title")?.trim();
    const description = formData.get("description")?.trim();
    const category = formData.get("category") || "General";
    const author = formData.get("author") || "Anonymous";
    const authorImg = formData.get("authorImg") || "/default-author.png";

    // Validate required fields
    if (!title || title.length < 3) {
      return NextResponse.json({ 
        success: false, 
        error: "Title is required and must be at least 3 characters",
        msg: "Please enter a valid blog title"
      }, { status: 400 });
    }

    if (!description || description.length < 10) {
      return NextResponse.json({ 
        success: false, 
        error: "Description is required and must be at least 10 characters",
        msg: "Please enter a valid blog description"
      }, { status: 400 });
    }

    const blogData = {
      title,
      description,
      category,
      author,
      image: imgUrl,
      authorImg,
      date: new Date()
    };

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
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({ 
        success: false, 
        error: "Validation error",
        msg: errorMessages.join(', ')
      }, { status: 400 });
    }
    
    if (error.code === 11000) {
      return NextResponse.json({ 
        success: false, 
        error: "Duplicate entry",
        msg: "Blog with this title already exists"
      }, { status: 409 });
    }

    if (error.message.includes('ENOSPC')) {
      return NextResponse.json({ 
        success: false, 
        error: "Storage full",
        msg: "Server storage is full. Please try again later."
      }, { status: 507 });
    }

    return NextResponse.json({ 
      success: false, 
      error: "Failed to create blog",
      msg: "An error occurred while creating the blog. Please try again."
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
        error: "Blog ID is required",
        msg: "Blog ID is required"
      }, { status: 400 });
    }

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid blog ID format",
        msg: "Invalid blog ID"
      }, { status: 400 });
    }

    const blog = await BlogModel.findById(id);
    
    if (!blog) {
      return NextResponse.json({ 
        success: false,
        error: "Blog not found",
        msg: "Blog not found"
      }, { status: 404 });
    }

    // Delete image file if it exists
    if (blog.image && blog.image !== '/default-image.png') {
      const imagePath = path.join(process.cwd(), 'public', blog.image);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
          console.log("Image file deleted:", blog.image);
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
      error: "Failed to delete blog",
      msg: "Failed to delete blog. Please try again."
    }, { status: 500 });
  }
}
