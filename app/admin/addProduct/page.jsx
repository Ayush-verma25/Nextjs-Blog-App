"use client";
import axios from "axios";
import Image from "next/image";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { assets } from "../../../Assets/assets";

const page = () => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
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

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    
    console.log("Form submission started");
    console.log("Form data:", {
      title: data.title,
      description: data.description.substring(0, 100) + "...",
      category: data.category,
      author: data.author,
      imageSize: image?.size,
      imageType: image?.type
    });
    
    // Enhanced validation
    if (!data.title.trim()) {
      console.log("Validation failed: No title");
      toast.error("Please enter a blog title");
      return;
    }
    
    if (data.title.trim().length < 3) {
      console.log("Validation failed: Title too short");
      toast.error("Blog title must be at least 3 characters long");
      return;
    }
    
    if (!data.description.trim()) {
      console.log("Validation failed: No description");
      toast.error("Please enter a blog description");
      return;
    }
    
    if (data.description.trim().length < 10) {
      console.log("Validation failed: Description too short");
      toast.error("Blog description must be at least 10 characters long");
      return;
    }
    
    if (!image) {
      console.log("Validation failed: No image");
      toast.error("Please select an image");
      return;
    }

    // File size validation (max 5MB)
    if (image.size > 5 * 1024 * 1024) {
      console.log("Validation failed: Image too large", image.size);
      toast.error("Image size should be less than 5MB");
      return;
    }

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(image.type)) {
      console.log("Validation failed: Invalid file type", image.type);
      toast.error("Please select a valid image file (JPEG, PNG, WebP)");
      return;
    }

    console.log("✓ All validations passed, starting upload...");
    setLoading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("title", data.title.trim());
      formData.append("description", data.description.trim());
      formData.append("category", data.category);
      formData.append("author", data.author);
      formData.append("authorImg", data.authorImg);
      formData.append("image", image);

      console.log("FormData created, sending request...");

      // Make request with detailed error handling
      const response = await axios.post("/api/blog", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // Increased to 60 seconds
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
        
        console.log("Form reset completed");
      } else {
        console.error("❌ Server returned success: false", response.data);
        toast.error(response.data.msg || response.data.error || "Error adding blog");
      }
      
    } catch (error) {
      console.error("❌ Request failed:", error);
      
      if (error.response) {
        // Server responded with error status
        console.error("Response error:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        const errorData = error.response.data;
        let errorMsg = "Server error occurred";
        
        if (errorData?.msg) {
          errorMsg = errorData.msg;
        } else if (errorData?.error) {
          errorMsg = errorData.error;
        } else if (errorData?.details) {
          errorMsg = errorData.details;
        }
        
        // Add status code to error message for debugging
        if (error.response.status >= 500) {
          errorMsg += ` (Server Error ${error.response.status})`;
        }
        
        toast.error(errorMsg);
        
      } else if (error.request) {
        // Request was made but no response received
        console.error("Network error - no response:", error.request);
        toast.error("No response from server. Please check your internet connection and try again.");
        
      } else if (error.code === 'ECONNABORTED') {
        // Request timeout
        console.error("Request timeout");
        toast.error("Request timeout. The server is taking too long to respond. Please try again.");
        
      } else {
        // Something else happened
        console.error("Unexpected error:", error.message);
        toast.error("An unexpected error occurred: " + error.message);
      }
    } finally {
      setLoading(false);
      console.log("Loading state reset");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("Image selected:", {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Validate file before setting
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        e.target.value = ""; // Clear the input
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please select a valid image file (JPEG, PNG, WebP)");
        e.target.value = ""; // Clear the input
        return;
      }
      
      setImage(file);
    }
  };

  return (
    <>
      <form onSubmit={onSubmitHandler} className="pt-5 px-5 sm:pt-12 sm:pl-16">
        <p className="text-xl">Upload thumbnail</p>
        <label htmlFor="image" className="cursor-pointer">
          <Image
            className="mt-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
            src={!image ? assets.upload_area : URL.createObjectURL(image)}
            width={140}
            height={70}
            alt="Upload thumbnail"
          />
        </label>
        <input
          onChange={handleImageChange}
          type="file"
          id="image"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          hidden
          required
        />
        
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
          disabled={loading}
          className={`mt-8 w-40 h-12 text-white rounded transition-colors ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-black hover:bg-gray-800'
          }`}
        >
          {loading ? "ADDING..." : "ADD"}
        </button>
        
        {/* Debug info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
            <p><strong>Debug Info:</strong></p>
            <p>Title length: {data.title.length}</p>
            <p>Description length: {data.description.length}</p>
            <p>Image selected: {image ? `${image.name} (${(image.size / 1024 / 1024).toFixed(2)}MB)` : 'None'}</p>
          </div>
        )}
      </form>
    </>
  );
};

export default page;
