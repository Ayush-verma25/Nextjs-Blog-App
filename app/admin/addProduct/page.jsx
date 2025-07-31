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
    
    // Validation
    if (!data.title.trim()) {
      toast.error("Please enter a blog title");
      return;
    }
    
    if (!data.description.trim()) {
      toast.error("Please enter a blog description");
      return;
    }
    
    if (!image) {
      toast.error("Please select an image");
      return;
    }

    // File size validation (max 5MB)
    if (image.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(image.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, WebP)");
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

      const response = await axios.post("/api/blog", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds timeout
      });

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
        // Reset file input
        const fileInput = document.getElementById("image");
        if (fileInput) fileInput.value = "";
      } else {
        toast.error(response.data.msg || "Error adding blog");
      }
    } catch (error) {
      console.error("Error:", error);
      if (error.response) {
        // Server responded with error status
        const errorMsg = error.response.data?.msg || error.response.data?.error || "Server error occurred";
        toast.error(errorMsg);
      } else if (error.request) {
        // Request was made but no response received
        toast.error("No response from server. Please check your connection.");
      } else if (error.code === 'ECONNABORTED') {
        // Request timeout
        toast.error("Request timeout. Please try again.");
      } else {
        // Something else happened
        toast.error("An unexpected error occurred");
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
            className="mt-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
            src={!image ? assets.upload_area : URL.createObjectURL(image)}
            width={140}
            height={70}
            alt="Upload thumbnail"
          />
        </label>
        <input
          onChange={(e) => setImage(e.target.files[0])}
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
          placeholder="Type here"
          required
          maxLength={200}
        />
        
        <p className="text-xl mt-4">Blog Description</p>
        <textarea
          name="description"
          onChange={onChangeHandler}
          value={data.description}
          className="w-full sm:w-[500px] mt-4 px-4 py-3 border rounded focus:outline-none focus:border-blue-500"
          placeholder="Write Content here"
          rows={6}
          required
          maxLength={10000}
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
      </form>
    </>
  );
};

export default page;
