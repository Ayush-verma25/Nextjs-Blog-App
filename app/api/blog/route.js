import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { ConnectDB } from "../../../lib/config/db";
import BlogModel from "../../../lib/models/BlogModels";
import fs from "fs";
import path from "path";

// API Endpoint to get all blogs
export async function GET(request) {
  try {
    console.log("GET /api/blog - Starting request");
    await ConnectDB();
    console.log("Database connected successfully");
    
    const blogId = request.nextUrl.searchParams.get("id");
    if (blogId) {
      // Validate MongoDB ObjectId format
      if (!blogId.match(/^[0-9a-fA-F]{24}$/)) {
        console.log("Invalid blog ID format:", blogId);
        return NextResponse.json({ 
          success: false,
          error: "Invalid blog ID format" 
        }, { status: 400 });
      }

      const blog = await BlogModel.findById(blogId);
      if (!blog) {
        console.log("Blog not found with ID:", blogId);
        return NextResponse.json({ 
          success: false,
          error: "Blog not found" 
        }, { status: 404 });
      }
      console.log("Blog found successfully");
      return NextResponse.json({ 
        success: true,
        blog 
      });
    } else {
      const blogs = await BlogModel.find({}).sort({ date: -1 });
      console.log(`Found ${blogs.length} blogs`);
      return NextResponse.json({ 
        success: true,
        blogs 
      });
    }
  } catch (error) {
    console.error("Detailed GET error:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch blogs",
      msg: "Database connection error",
      details: error.message
    }, { status: 500 });
  }
}

// API Endpoint for Uploading Blog
export async function POST(request) {
  console.log("POST /api/blog - Starting blog creation");
  
  try {
    // Step 1: Connect to database
    console.log("Step 1: Connecting to database...");
    await ConnectDB();
    console.log("✓ Database connected successfully");
    
    // Step 2: Parse form data
    console.log("Step 2: Parsing form data...");
    const formData = await request.formData();
    const timestamp = Date.now();
    console.log("✓ Form data parsed, timestamp:", timestamp);

    // Step 3: Get and validate image
    console.log("Step 3: Validating image...");
    const image = formData.get("image");
    
    if (!image || !image.name || image.size === 0) {
      console.log("❌ Image validation failed: No valid image provided");
      return NextResponse.json({ 
        success: false, 
        error: "No valid image provided",
        msg: "Please select an image"
      }, { status: 400 });
    }

    console.log("Image details:", {
      name: image.name,
      size: image.size,
      type: image.type
    });

    // File size validation (5MB max)
    if (image.size > 5 * 1024 * 1024) {
      console.log("❌ Image too large:", image.size);
      return NextResponse.json({ 
        success: false, 
        error: "File too large",
        msg: "Image size should be less than 5MB"
      }, { status: 400 });
    }

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(image.type)) {
      console.log("❌ Invalid file type:", image.type);
      return NextResponse.json({ 
        success: false, 
        error: "Invalid file type",
        msg: "Only JPEG, PNG, and WebP images are allowed"
      }, { status: 400 });
    }
    console.log("✓ Image validation passed");

    // Step 4: Process image
    console.log("Step 4: Processing image...");
    let imageByteData, buffer;
    try {
      imageByteData = await image.arrayBuffer();
      buffer = Buffer.from(imageByteData);
      console.log("✓ Image buffer created, size:", buffer.length);
    } catch (imageError) {
      console.error("❌ Image processing failed:", imageError);
      return NextResponse.json({ 
        success: false, 
        error: "Image processing failed",
        msg: "Failed to process the uploaded image"
      }, { status: 400 });
    }
    
    // Step 5: Create directory and save file
    console.log("Step 5: Creating directory and saving file...");
    const publicDir = path.join(process.cwd(), 'public');
    console.log("Public directory path:", publicDir);
    
    try {
      if (!fs.existsSync(publicDir)) {
        console.log("Creating public directory...");
        fs.mkdirSync(publicDir, { recursive: true });
      }
      console.log("✓ Public directory ready");
    } catch (dirError) {
      console.error("❌ Directory creation failed:", dirError);
      return NextResponse.json({ 
        success: false, 
        error: "Directory creation failed",
        msg: "Server configuration error"
      }, { status: 500 });
    }
    
    // Sanitize filename and add extension if missing
    const fileExtension = path.extname(image.name) || '.jpg';
    const sanitizedFileName = image.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.(jpg|jpeg|png|webp)$/i, '') + fileExtension;
    
    const imagePath = path.join(publicDir, `${timestamp}_${sanitizedFileName}`);
    const imgUrl = `/${timestamp}_${sanitizedFileName}`;
    
    console.log("Saving image to:", imagePath);
    
    try {
      await writeFile(imagePath, buffer);
      console.log("✓ Image saved successfully");
    } catch (writeError) {
      console.error("❌ File write failed:", writeError);
      return NextResponse.json({ 
        success: false, 
        error: "File write failed",
        msg: "Failed to save image file"
      }, { status: 500 });
    }

    // Step 6: Get and validate form data
    console.log("Step 6: Validating form data...");
    const title = formData.get("title")?.trim();
    const description = formData.get("description")?.trim();
    const category = formData.get("category") || "General";
    const author = formData.get("author") || "Anonymous";
    const authorImg = formData.get("authorImg") || "/default-author.png";

    console.log("Form data:", {
      title: title?.substring(0, 50),
      description: description?.substring(0, 100),
      category,
      author,
      authorImg
    });

    // Validate required fields
    if (!title || title.length < 3) {
      console.log("❌ Title validation failed");
      return NextResponse.json({ 
        success: false, 
        error: "Title is required and must be at least 3 characters",
        msg: "Please enter a valid blog title"
      }, { status: 400 });
    }

    if (!description || description.length < 10) {
      console.log("❌ Description validation failed");
      return NextResponse.json({ 
        success: false, 
        error: "Description is required and must be at least 10 characters",
        msg: "Please enter a valid blog description"
      }, { status: 400 });
    }
    console.log("✓ Form data validation passed");

    // Step 7: Create blog document
    console.log("Step 7: Creating blog document...");
    const blogData = {
      title,
      description,
      category,
      author,
      image: imgUrl,
      authorImg,
      date: new Date()
    };

    console.log("Blog data to save:", {
      ...blogData,
      description: blogData.description.substring(0, 100) + "..."
    });

    let newBlog;
    try {
      newBlog = await BlogModel.create(blogData);
      console.log("✓ Blog saved successfully with ID:", newBlog._id);
    } catch (dbError) {
      console.error("❌ Database save failed:", {
        message: dbError.message,
        name: dbError.name,
        code: dbError.code
      });
      
      // Clean up uploaded file if database save fails
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log("Cleaned up uploaded file after DB error");
        }
      } catch (cleanupError) {
        console.error("Failed to cleanup file:", cleanupError);
      }
      
      throw dbError; // Re-throw to be handled by main catch block
    }

    console.log("✅ Blog creation completed successfully");
    return NextResponse.json({ 
      success: true, 
      msg: "Blog Added Successfully",
      blog: newBlog
    });

  } catch (error) {
    console.error("❌ MAIN ERROR in POST /api/blog:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    // More specific error handling
    if (error.name === 'ValidationError') {
      console.error("Validation Error Details:", error.errors);
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({ 
        success: false, 
        error: "Validation error",
        msg: errorMessages.join(', '),
        details: error.message
      }, { status: 400 });
    }
    
    if (error.code === 11000) {
      console.error("Duplicate key error:", error.keyPattern);
      return NextResponse.json({ 
        success: false, 
        error: "Duplicate entry",
        msg: "Blog with this title already exists",
        details: error.message
      }, { status: 409 });
    }

    if (error.message.includes('ENOSPC')) {
      return NextResponse.json({ 
        success: false, 
        error: "Storage full",
        msg: "Server storage is full. Please try again later."
      }, { status: 507 });
    }

    if (error.message.includes('EACCES') || error.message.includes('EPERM')) {
      return NextResponse.json({ 
        success: false, 
        error: "Permission denied",
        msg: "Server permission error. Please contact administrator."
      }, { status: 500 });
    }

    // Generic error with more details
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create blog",
      msg: "An error occurred while creating the blog. Please try again.",
      details: error.message,
      errorType: error.name
    }, { status: 500 });
  }
}

// API Endpoint to delete blog
export async function DELETE(request) {
  try {
    console.log("DELETE /api/blog - Starting request");
    await ConnectDB();
    console.log("Database connected successfully");
    
    const id = request.nextUrl.searchParams.get("id");
    
    if (!id) {
      console.log("No ID provided for deletion");
      return NextResponse.json({ 
        success: false,
        error: "Blog ID is required",
        msg: "Blog ID is required"
      }, { status: 400 });
    }

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log("Invalid ID format:", id);
      return NextResponse.json({ 
        success: false,
        error: "Invalid blog ID format",
        msg: "Invalid blog ID"
      }, { status: 400 });
    }

    const blog = await BlogModel.findById(id);
    
    if (!blog) {
      console.log("Blog not found for deletion:", id);
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
    console.log("Blog deleted successfully:", id);
    
    return NextResponse.json({ 
      success: true, 
      msg: "Blog Deleted Successfully" 
    });

  } catch (error) {
    console.error("Detailed DELETE error:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({ 
      success: false,
      error: "Failed to delete blog",
      msg: "Failed to delete blog. Please try again.",
      details: error.message
    }, { status: 500 });
  }
}
