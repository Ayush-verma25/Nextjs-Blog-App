"use client";
import axios from "axios";
import Image from "next/image";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { assets } from "../../../Assets/assets";

const page = () => {
  const [image, setImage] = useState(null); // Changed from false to null
  const [loading, setLoading] = useState(false); // Added loading state
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
    setData((prevData) => ({ // Fixed state update
      ...prevData,
      [name]: value
    }));
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!image) {
      toast.error("Please select an image");
      return;
    }
    
    if (!data.title.trim() || !data.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append("title", data.title.trim());
      formData.append("description", data.description.trim());
      formData.append("category", data.category);
      formData.append("author", data.author);
      formData.append("authorImg", data.authorImg);
      formData.append("image", image);

      // Add debugging
      console.log("Submitting form data:", {
        title: data.title,
        description: data.description,
        category: data.category,
        author: data.author,
        authorImg: data.authorImg,
        imageFile: image?.name
      });

      const response = await axios.post("/api/blog", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });

      console.log("Response:", response.data);

      if (response.data.success) {
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
      } else {
        toast.error(response.data.msg || "Failed to add blog");
      }
    } catch (error) {
      console.error("Error submitting blog:", error);
      
      if (error.response) {
        // Server responded with error status
        const errorMsg = error.response.data?.msg || error.response.data?.message || "Server error occurred";
        toast.error(errorMsg);
        console.error("Server error:", error.response.data);
      } else if (error.request) {
        // Request was made but no response received
        toast.error("Network error. Please check your connection.");
        console.error("Network error:", error.request);
      } else {
        // Something else happened
        toast.error("An unexpected error occurred");
        console.error("Error:", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={onSubmitHandler} className="pt-5 px-5 sm:pt-12 sm:pl-16">
        <p className="text-xl">Upload thumbnail</p>
        <label htmlFor="image" className="cursor-pointer">
          <Image
            className="mt-4 border-2 border-dashed border-gray-300 rounded"
            src={!image ? assets.upload_area : URL.createObjectURL(image)}
            width={140}
            height={70}
            alt="Upload thumbnail"
          />
        </label>
        <input
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              // Validate file type
              const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
              if (!validTypes.includes(file.type)) {
                toast.error("Please select a valid image file (JPEG, PNG, WebP)");
                return;
              }
              
              // Validate file size (e.g., max 5MB)
              if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size should be less than 5MB");
                return;
              }
              
              setImage(file);
            }
          }}
          type="file"
          id="image"
          accept="image/*"
          hidden
          required
        />
        
        <p className="text-xl mt-4">Blog title</p>
        <input
          name="title"
          onChange={onChangeHandler}
          value={data.title}
          className="w-full sm:w-[500px] mt-4 px-4 py-3 border rounded"
          type="text"
          placeholder="Type here"
          required
          maxLength={200}
        />
        
        <p className="text-xl mt-4">Blog Description</p>
        <textarea
          name="description"
          onChange={onChangeHandler}
          value={data.description}
          className="w-full sm:w-[500px] mt-4 px-4 py-3 border rounded"
          placeholder="Write Content here"
          rows={6}
          required
        />
        
        <p className="text-xl mt-4">Blog Category</p>
        <select
          onChange={onChangeHandler}
          value={data.category}
          name="category"
          className="w-40 mt-4 px-4 py-3 border text-gray-500 rounded"
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
      </form>
    </>
  );
};

export default page;
