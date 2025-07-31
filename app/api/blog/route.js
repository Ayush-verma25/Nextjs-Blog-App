import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { ConnectDB } from "../../../lib/config/db";
import BlogModel from "../../../lib/models/BlogModels";
import fs from "fs";
import path from "path";

// API Endpoint to get all blogs
export async function GET(request) {
  try {
    console.log("🔍 GET /api/blog - Starting request");
    await ConnectDB();
    console.log("✅ Database connected successfully");
    
    const blogId = request.nextUrl.searchParams.get("id");
    if (blogId) {
      if (!blogId.match(/^[0-9a-fA-F]{24}$/)) {
        console.log("❌ Invalid blog ID format:", blogId);
        return NextResponse.json({ 
          success: false,
          error: "Invalid blog ID format" 
        }, { status: 400 });
      }

      const blog = await BlogModel.findById(blogId);
      if (!blog) {
        console.log("❌ Blog not found with ID:", blogId);
        return NextResponse.json({ 
          success: false,
          error: "Blog not found" 
        }, { status: 404 });
      }
      console.log("✅ Blog found successfully");
      return NextResponse.json({ 
        success: true,
        blog 
      });
    } else {
      const blogs = await BlogModel.find({}).sort({ date: -1 });
      console.log(`✅ Found ${blogs.length} blogs`);
      return NextResponse.json({ 
        success: true,
        blogs 
      });
    }
  } catch (error) {
    console.error("❌ DETAILED GET ERROR:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch blogs",
      msg: "Database connection error",
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

// API Endpoint for Uploading Blog
export async function POST(request) {
  console.log("🚀 POST /api/blog - Starting blog creation");
  console.log("📊 Environment:", {
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL ? 'Yes' : 'No',
    mongoUri: process.env.MONGODB_URI ? 'Set' : 'Missing'
  });
  
  try {
    // Step 1: Connect to database with timeout
    console.log("🔗 Step 1: Connecting to database...");
    const dbStart = Date.now();
    
    try {
      await ConnectDB();
      console.log(`✅ Database connected in ${Date.now() - dbStart}ms`);
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError.message);
      return NextResponse.json({ 
        success: false, 
        error: "Database connection failed",
        msg: "Unable to connect to database. Please try again.",
        details: process.env.NODE_ENV === 'development' ? dbError.message : 'Database error'
      }, { status: 500 });
    }
    
    // Step 2: Parse form data with error handling
    console.log("📝 Step 2: Parsing form data...");
    let formData;
    try {
      formData = await request.formData();
      console.log("✅ Form data parsed successfully");
    } catch (formError) {
      console.error("❌ Form data parsing failed:", formError.message);
      return NextResponse.json({ 
        success: false, 
        error: "Form data parsing failed",
        msg: "Invalid form data received",
        details: process.env.NODE_ENV === 'development' ? formError.message : 'Form parsing error'
      }, { status: 400 });
    }

    const timestamp = Date.now();
    console.log("⏰ Timestamp:", timestamp);

    // Step 3: Extract and validate image
    console.log("🖼️  Step 3: Validating image...");
    const image = formData.get("image");
    
    if (!image) {
      console.log("❌ No image in form data");
      return NextResponse.json({ 
        success: false, 
        error: "No image provided",
        msg: "Please select an image"
      }, { status: 400 });
    }

    // Check if image is actually a File object
    if (!(image instanceof File)) {
      console.log("❌ Image is not a File object:", typeof image);
      return NextResponse.json({ 
        success: false, 
        error: "Invalid image format",
        msg: "Invalid image file received"
      }, { status: 400 });
    }

    console.log("📊 Image details:", {
      name: image.name,
      size: `${(image.size / 1024 / 1024).toFixed(2)} MB`,
      type: image.type,
      lastModified: image.lastModified
    });

    // Validate image properties
    if (!image.name || image.size === 0) {
      console.log("❌ Invalid image properties");
      return NextResponse.json({ 
        success: false, 
        error: "Invalid image",
        msg: "Please select a valid image file"
      }, { status: 400 });
    }

    // File size validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (image.size > maxSize) {
      console.log(`❌ Image too large: ${(image.size / 1024 / 1024).toFixed(2)}MB`);
      return NextResponse.json({ 
        success: false, 
        error: "File too large",
        msg: `Image size (${(image.size / 1024 / 1024).toFixed(2)}MB) exceeds 5MB limit`
      }, { status: 400 });
    }

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(image.type)) {
      console.log("❌ Invalid file type:", image.type);
      return NextResponse.json({ 
        success: false, 
        error: "Invalid file type",
        msg: `File type ${image.type} not allowed. Use JPEG, PNG, or WebP.`
      }, { status: 400 });
    }
    console.log("✅ Image validation passed");

    // Step 4: Process image buffer
    console.log("🔄 Step 4: Processing image buffer...");
    let imageByteData, buffer;
    try {
      imageByteData = await image.arrayBuffer();
      buffer = Buffer.from(imageByteData);
      console.log(`✅ Image buffer created: ${buffer.length} bytes`);
    } catch (bufferError) {
      console.error("❌ Buffer creation failed:", bufferError.message);
      return NextResponse.json({ 
        success: false, 
        error: "Image processing failed",
        msg: "Failed to process the uploaded image",
        details: process.env.NODE_ENV === 'development' ? bufferError.message : 'Image processing error'
      }, { status: 400 });
    }
    
    // Step 5: Handle file system operations
    console.log("💾 Step 5: Setting up file system...");
    const publicDir = path.join(process.cwd(), 'public');
    console.log("📁 Public directory path:", publicDir);
    
    // Check if we're on Vercel (read-only filesystem)
    const isVercel = process.env.VERCEL === '1';
    console.log("🌐 Running on Vercel:", isVercel);
    
    let imgUrl;
    
    if (isVercel) {
      // On Vercel, we can't write to filesystem, so we'll use a different approach
      console.log("⚠️  Vercel detected - filesystem is read-only");
      
      // Option 1: Return base64 data URL (temporary solution)
      const base64 = buffer.toString('base64');
      imgUrl = `data:${image.type};base64,${base64}`;
      console.log("✅ Using base64 data URL for image");
      
      // Note: This is not ideal for production as it stores large data in DB
      // Consider using Cloudinary or Vercel Blob Storage for production
      
    } else {
      // Local development - use filesystem
      try {
        if (!fs.existsSync(publicDir)) {
          console.log("📁 Creating public directory...");
          fs.mkdirSync(publicDir, { recursive: true });
        }
        console.log("✅ Public directory ready");
      } catch (dirError) {
        console.error("❌ Directory creation failed:", dirError.message);
        return NextResponse.json({ 
          success: false, 
          error: "Directory creation failed",
          msg: "Server configuration error",
          details: process.env.NODE_ENV === 'development' ? dirError.message : 'File system error'
        }, { status: 500 });
      }
      
      // Create filename
      const fileExtension = path.extname(image.name) || '.jpg';
      const sanitizedFileName = image.name
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/\.(jpg|jpeg|png|webp)$/i, '') + fileExtension;
      
      const imagePath = path.join(publicDir, `${timestamp}_${sanitizedFileName}`);
      imgUrl = `/${timestamp}_${sanitizedFileName}`;
      
      console.log("💾 Saving image to:", imagePath);
      
      try {
        await writeFile(imagePath, buffer);
        console.log("✅ Image saved successfully");
      } catch (writeError) {
        console.error("❌ File write failed:", writeError.message);
        return NextResponse.json({ 
          success: false, 
          error: "File write failed",
          msg: "Failed to save image file",
          details: process.env.NODE_ENV === 'development' ? writeError.message : 'File write error'
        }, { status: 500 });
      }
    }

    // Step 6: Extract and validate form fields
    console.log("📋 Step 6: Processing form fields...");
    const title = formData.get("title")?.toString()?.trim() || "";
    const description = formData.get("description")?.toString()?.trim() || "";
    const category = formData.get("category")?.toString() || "General";
    const author = formData.get("author")?.toString() || "Anonymous";
    const authorImg = formData.get("authorImg")?.toString() || "/default-author.png";

    console.log("📊 Form fields:", {
      title: title.length > 50 ? title.substring(0, 47) + "..." : title,
      descriptionLength: description.length,
      category,
      author,
      authorImg
    });

    // Validate required fields
    if (!title || title.length < 3) {
      console.log("❌ Title validation failed:", { title, length: title.length });
      return NextResponse.json({ 
        success: false, 
        error: "Invalid title",
        msg: "Blog title must be at least 3 characters long"
      }, { status: 400 });
    }

    if (!description || description.length < 10) {
      console.log("❌ Description validation failed:", { length: description.length });
      return NextResponse.json({ 
        success: false, 
        error: "Invalid description",
        msg: "Blog description must be at least 10 characters long"
      }, { status: 400 });
    }
    console.log("✅ Form fields validation passed");

    // Step 7: Create blog document
    console.log("💾 Step 7: Creating blog document...");
    const blogData = {
      title,
      description,
      category,
      author,
      image: imgUrl,
      authorImg,
      date: new Date()
    };

    console.log("📋 Blog data summary:", {
      title: blogData.title.substring(0, 30) + "...",
      descriptionLength: blogData.description.length,
      category: blogData.category,
      author: blogData.author,
      imageLength: blogData.image.length,
      date: blogData.date.toISOString()
    });

    let newBlog;
    try {
      console.log("💾 Attempting to save to database...");
      newBlog = await BlogModel.create(blogData);
      console.log(`✅ Blog saved successfully with ID: ${newBlog._id}`);
    } catch (dbSaveError) {
      console.error("❌ Database save failed:", {
        message: dbSaveError.message,
        name: dbSaveError.name,
        code: dbSaveError.code,
        errors: dbSaveError.errors
      });
      
      // Clean up uploaded file if database save fails (local only)
      if (!isVercel && imgUrl.startsWith('/')) {
        try {
          const imagePath = path.join(publicDir, imgUrl);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log("🧹 Cleaned up uploaded file after DB error");
          }
        } catch (cleanupError) {
          console.error("⚠️  Failed to cleanup file:", cleanupError.message);
        }
      }
      
      // Return specific database error
      if (dbSaveError.name === 'ValidationError') {
        const errorMessages = Object.values(dbSaveError.errors).map(err => err.message);
        return NextResponse.json({ 
          success: false, 
          error: "Validation error",
          msg: errorMessages.join(', '),
          details: process.env.NODE_ENV === 'development' ? dbSaveError.message : 'Validation failed'
        }, { status: 400 });
      }
      
      if (dbSaveError.code === 11000) {
        return NextResponse.json({ 
          success: false, 
          error: "Duplicate entry",
          msg: "Blog with this title already exists"
        }, { status: 409 });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: "Database save failed",
        msg: "Failed to save blog to database",
        details: process.env.NODE_ENV === 'development' ? dbSaveError.message : 'Database error'
      }, { status: 500 });
    }

    console.log("🎉 Blog creation completed successfully!");
    return NextResponse.json({ 
      success: true, 
      msg: "Blog Added Successfully",
      blog: {
        _id: newBlog._id,
        title: newBlog.title,
        category: newBlog.category,
        author: newBlog.author,
        date: newBlog.date
      }
    });

  } catch (error) {
    console.error("💥 CRITICAL ERROR in POST /api/blog:", {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : 'Stack trace hidden in production',
      name: error.name,
      code: error.code,
      cause: error.cause
    });
    
    // Return generic error with details only in development
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error",
      msg: "An unexpected error occurred. Please try again.",
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal error',
      errorType: error.name
    }, { status: 500 });
  }
}

// API Endpoint to delete blog
export async function DELETE(request) {
  try {
    console.log("🗑️  DELETE /api/blog - Starting request");
    await ConnectDB();
    console.log("✅ Database connected successfully");
    
    const id = request.nextUrl.searchParams.get("id");
    
    if (!id) {
      console.log("❌ No ID provided for deletion");
      return NextResponse.json({ 
        success: false,
        error: "Blog ID is required",
        msg: "Blog ID is required"
      }, { status: 400 });
    }

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log("❌ Invalid ID format:", id);
      return NextResponse.json({ 
        success: false,
        error: "Invalid blog ID format",
        msg: "Invalid blog ID"
      }, { status: 400 });
    }

    const blog = await BlogModel.findById(id);
    
    if (!blog) {
      console.log("❌ Blog not found for deletion:", id);
      return NextResponse.json({ 
        success: false,
        error: "Blog not found",
        msg: "Blog not found"
      }, { status: 404 });
    }

    // Delete image file if it exists and not on Vercel
    if (blog.image && blog.image !== '/default-image.png' && !blog.image.startsWith('data:') && process.env.VERCEL !== '1') {
      const imagePath = path.join(process.cwd(), 'public', blog.image);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
          console.log("🗑️  Image file deleted:", blog.image);
        } catch (fileError) {
          console.warn("⚠️  Failed to delete image file:", fileError.message);
        }
      }
    }

    await BlogModel.findByIdAndDelete(id);
    console.log("✅ Blog deleted successfully:", id);
    
    return NextResponse.json({ 
      success: true, 
      msg: "Blog Deleted Successfully" 
    });

  } catch (error) {
    console.error("❌ DETAILED DELETE ERROR:", {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : 'Hidden',
      name: error.name
    });
    return NextResponse.json({ 
      success: false,
      error: "Failed to delete blog",
      msg: "Failed to delete blog. Please try again.",
      details: process.env.NODE_ENV === 'development' ? error.message : 'Delete error'
    }, { status: 500 });
  }
}
