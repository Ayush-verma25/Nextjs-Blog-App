"use client";
import axios from "axios";
import Image from "next/image";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { assets } from "../../../Assets/assets";

const page = () => {
  const [image, setImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [data, setData] = useState({
    title: "",
    description: "",
    category: "Startup",
    author: "Alex Bennett",
    authorImg: "/author_img.png",
  });

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Simple image compression function (without external library)
  const compressImage = (file, maxSizeMB = 1, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      
      img.onload = () => {
        // Calculate new dimensions
        const maxWidth = 1200;
        const maxHeight = 1200;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            // Create a new File object from the blob
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg', // Convert to JPEG for better compression
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log("Original image selected:", {
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + " MB",
      type: file.type
    });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, WebP)");
      e.target.value = "";
      return;
    }

    setOriginalImage(file);

    // Check if compression is needed
    const maxSize = 1 * 1024 * 1024; // 1MB
    if (file.size <= maxSize) {
      console.log("Image is already small enough, no compression needed");
      setImage(file);
      return;
    }

    // Compress image
    setCompressing(true);
    try {
      console.log("Compressing image...");
      
      let compressedFile = await compressImage(file, 1, 0.8);
      
      // If still too large, compress more aggressively
      if (compressedFile.size > maxSize) {
        console.log("First compression not enough, compressing more...");
        compressedFile = await compressImage(file, 1, 0.6);
      }
      
      // If still too large, compress even more
      if (compressedFile.size > maxSize) {
        console.log("Second compression not enough, final compression...");
        compressedFile = await compressImage(file, 1, 0.4);
      }

      console.log("Compression completed:", {
        originalSize: (file.size / 1024 / 1024).toFixed(2) + " MB",
        compressedSize: (compressedFile.size / 1024 / 1024).toFixed(2) + " MB",
        reduction: (((file.size - compressedFile.size) / file.size) * 100).toFixed(1) + "%"
      });

      setImage(compressedFile);
      
      if (compressedFile.size > maxSize) {
        toast.warn(`Image is still ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB. Try a smaller image for best results.`);
      } else {
        toast.success(`Image compressed successfully! Size reduced by ${(((file.size - compressedFile.size) / file.size) * 100).toFixed(1)}%`);
      }
      
    } catch (error) {
      console.error("Image compression failed:", error);
      toast.error("Failed to compress image. Please try a different image.");
      e.target.value = "";
    } finally {
      setCompressing(false);
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    
    console.log("Form submission started");
    
    // Enhanced validation
    if (!data.title.trim()) {
      toast.error("Please enter a blog title");
      return;
    }
    
    if (data.title.trim().length < 3) {
      toast.error("Blog title must be at least 3 characters long");
      return;
    }
    
    if (!data.description.trim()) {
      toast.error("Please enter a blog description");
      return;
    }
    
    if (data.description.trim().length < 10) {
      toast.error("Blog description must be at least 10 characters long");
      return;
    }
    
    if (!image) {
      toast.error("Please select an image");
      return;
    }

    // Final size check
    const maxSize = 2 * 1024 * 1024; // 2MB final limit
    if (image.size > maxSize) {
      toast.error(`Image is too large (${(image.size / 1024 / 1024).toFixed(2)}MB). Please select a smaller image.`);
      return;
    }

    console.log("✓ All validations passed, starting upload...");
    console.log("Final image size:", (image.size / 1024 / 1024).toFixed(2), "MB");
    
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", data.title.trim());
      formData.append("description", data.description.trim());
      formData.append("category", data.category);
      formData.append("author", data.author);
      formData.append("authorImg", data.authorImg);
      formData.append("image", image);

      console.log("Sending request to server...");

      const response = await axios.post("/api/blog", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
        maxContentLength: 10 * 1024 * 1024, // 10MB
        maxBodyLength: 10 * 1024 * 1024, // 10MB
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log("Upload progress:", percentCompleted + "%");
        }
      });

      console.log("Response received:", response.data);

      if (response.data.success) {
        console.log("✅ Blog created successfully!");
        toast.success(response.data.msg || "Blog added successfully!");
        
        // Reset form
        setImage(null);
        setOriginalImage(null);
        setData({
          title: "",
          description: "",
          category: "Startup",
          author: "Alex Bennett",
          authorImg: "/author_img.png",
        });
        
        // Reset file input
        const fileInput = document.getElementById("image");
        if (fileInput) fileInput.value = "";
        
      } else {
        console.error("❌ Server returned success: false", response.data);
        toast.error(response.data.msg || response.data.error || "Error adding blog");
      }
      
    } catch (error) {
      console.error("❌ Request failed:", error);
      
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        console.error("Response error:", {
          status,
          statusText: error.response.statusText,
          data: errorData
        });
        
        if (status === 413) {
          toast.error("Image is too large for upload. Please select a smaller image or try compressing it further.");
        } else if (status === 502 || status === 504) {
          toast.error("Server timeout. Please try again with a smaller image.");
        } else {
          const errorMsg = errorData?.msg || errorData?.error || errorData?.details || "Server error occurred";
          toast.error(errorMsg);
        }
        
      } else if (error.request) {
        console.error("Network error:", error.request);
        toast.error("Network error. Please check your connection and try again.");
        
      } else if (error.code === 'ECONNABORTED') {
        console.error("Request timeout");
        toast.error("Upload timeout. Please try with a smaller image.");
        
      } else {
        console.error("Unexpected error:", error.message);
        toast.error("Upload failed: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={onSubmitHandler} className="pt-5 px-5 sm:pt-12 sm:pl-16">
        <p className="text-xl">Upload thumbnail</p>
        <label htmlFor="image" className={`cursor-pointer ${compressing ? 'opacity-50' : ''}`}>
          <Image
            className="mt-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
            src={!image ? assets.upload_area : URL.createObjectURL(image)}
            width={140}
            height={70}
            alt="Upload thumbnail"
          />
          {compressing && (
            <div className="mt-2 text-sm text-blue-600">
              Compressing image...
            </div>
          )}
        </label>
        <input
          onChange={handleImageChange}
          type="file"
          id="image"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          hidden
          required
          disabled={compressing}
        />
        
        {/* Image info display */}
        {image && (
          <div className="mt-2 text-sm text-gray-600">
            Final size: {(image.size / 1024 / 1024).toFixed(2)} MB
            {originalImage && originalImage.size !== image.size && (
              <span className="text-green-600 ml-2">
                (Compressed from {(originalImage.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            )}
          </div>
        )}
        
        <p className="text-xl mt-4">Blog title</p>
        <input
          name="title"
          onChange={onChangeHandler}
          value={data.title}
          className="w-full sm:w-[500px] mt-4 px-4 py-3 border rounded focus:outline-none focus:border-blue-500"
          type="text"
          placeholder="Type here (minimum 3 characters)"
          required
          maxLength={200}
          minLength={3}
        />
        
        <p className="text-xl mt-4">Blog Description</p>
        <textarea
          name="description"
          onChange={onChangeHandler}
          value={data.description}
          className="w-full sm:w-[500px] mt-4 px-4 py-3 border rounded focus:outline-none focus:border-blue-500"
          placeholder="Write Content here (minimum 10 characters)"
          rows={6}
          required
          maxLength={10000}
          minLength={10}
        />
        
        <p className="text-xl mt-4">Blog Category</p>
        <select
          onChange={onChangeHandler}
          value={data.category}
          name="category"
          className="w-40 mt-4 px-4 py-3 border text-gray-700 rounded focus:outline-none focus:border-blue-500"
        >
          <option value="Startup">Startup</option>
          <option value="Technology">Technology</option>
          <option value="Lifestyle">Lifestyle</option>
        </select>
        
        <br />
        <button
          type="submit"
          disabled={loading || compressing}
          className={`mt-8 w-40 h-12 text-white rounded transition-colors ${
            loading || compressing
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-black hover:bg-gray-800'
          }`}
        >
          {compressing ? "COMPRESSING..." : loading ? "ADDING..." : "ADD"}
        </button>
        
        {/* Tips */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800">Tips for better uploads:</h4>
          <ul className="text-sm text-blue-700 mt-2">
            <li>• Images are automatically compressed to reduce size</li>
            <li>• For best results, use images smaller than 2MB</li>
            <li>• JPEG format typically has the smallest file size</li>
            <li>• Try to use images with dimensions under 1920x1920px</li>
          </ul>
        </div>
      </form>
    </>
  );
};

export default page;
