"use client";
import axios from "axios";
import Image from "next/image";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { assets } from "../../../Assets/assets";

const page = () => {
  const [image, setImage] = useState(null); // Changed from false to null
  const [data, setData] = useState({
    title: "",
    description: "",
    category: "Startup",
    author: "Alex Bennett",
    authorImg: "/author_img.png",
  });
  const [isSubmitting, setIsSubmitting] = useState(false); // Added loading state

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((prevData) => ({ ...prevData, [name]: value })); // Fixed state update
    console.log(data);
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

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("category", data.category);
      formData.append("author", data.author);
      formData.append("authorImg", data.authorImg);
      formData.append("image", image);

      // Log formData for debugging
      console.log("FormData entries:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await axios.post("/api/blog", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });

      console.log("Response:", response.data); // Debug log

      if (response.data.success) {
        toast.success(response.data.msg || "Blog added successfully!");
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
        toast.error(response.data.msg || "Failed to add blog");
      }
    } catch (error) {
      console.error("Error submitting blog:", error);
      
      if (error.response) {
        // Server responded with error status
        console.error("Error response:", error.response.data);
        toast.error(
          error.response.data?.msg || 
          error.response.data?.message || 
          `Server error: ${error.response.status}`
        );
      } else if (error.request) {
        // Request was made but no response received
        console.error("No response received:", error.request);
        toast.error("No response from server. Check your connection.");
      } else {
        // Something else happened
        console.error("Error:", error.message);
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
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
          onChange={(e) => setImage(e.target.files[0])}
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
          disabled={isSubmitting}
          className={`mt-8 w-40 h-12 text-white rounded transition-colors ${
            isSubmitting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-black hover:bg-gray-800'
          }`}
        >
          {isSubmitting ? "ADDING..." : "ADD"}
        </button>
      </form>
    </>
  );
};

export default page;
