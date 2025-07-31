"use client";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { assets } from "../../../Assets/assets";
import Footer from "../../../Components/Footer";

const page = ({ params }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBlogData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Make sure params.id exists
      if (!params?.id) {
        throw new Error("Blog ID is required");
      }

      // Validate ObjectId format
      if (!params.id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error("Invalid blog ID format");
      }

      const response = await axios.get("/api/blog", {
        params: {
          id: params.id,
        },
        timeout: 10000, // 10 seconds timeout
      });

      if (response.data && response.data.success && response.data.blog) {
        setData(response.data.blog);
      } else {
        throw new Error(response.data?.error || "Blog not found");
      }
    } catch (error) {
      console.error("Error fetching blog data:", error);
      
      if (error.code === 'ECONNABORTED') {
        setError("Request timeout. Please try again.");
      } else if (error.response?.status === 404) {
        setError("Blog not found");
      } else if (error.response?.status >= 500) {
        setError("Server error. Please try again later.");
      } else {
        setError(error.response?.data?.error || error.message || "Failed to load blog");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params?.id) {
      fetchBlogData();
    }
  }, [params?.id]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading blog...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Oops!</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button 
              onClick={fetchBlogData}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-4"
            >
              Try Again
            </button>
            <Link href="/" className="inline-block px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
              Go Back Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main content
  return data ? (
    <>
      <div className="bg-gray-200 py-5 px-5 md:px-12 lg:px-28">
        <div className="flex justify-between items-center">
          <Link href="/">
            <Image
              src={assets.logo}
              width={180}
              alt="Logo"
              className="w-[130px] sm:w-auto"
            />
          </Link>
          <button className="flex items-center gap-2 font-medium py-1 px-3 sm:py-3 sm:px-6 border border-black shadow-[-7px_7px_0px_#000000] hover:shadow-[-5px_5px_0px_#000000] transition-all">
            Get Started <Image src={assets.arrow} alt="Arrow" />
          </button>
        </div>
        <div className="text-center my-24">
          <h1 className="text-2xl sm:text-5xl font-semibold max-w-[700px] mx-auto">
            {data.title}
          </h1>
          {data.authorImg && (
            <Image
              className="mx-auto mt-6 border border-white rounded-full"
              src={data.authorImg}
              alt={data.author || "Author"}
              width={60}
              height={60}
              onError={(e) => {
                e.target.src = '/default-author.png';
              }}
            />
          )}
          <p className="mt-1 pb-2 text-lg max-w-[740px] mx-auto">
            {data.author || "Anonymous"}
          </p>
          {data.date && (
            <p className="text-sm text-gray-600">
              Published on {new Date(data.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          )}
        </div>
      </div>
      <div className="mx-5 max-w-[800px] md:mx-auto mt-[-100px] mb-10">
        {data.image && (
          <Image
            className="border-4 border-white"
            src={data.image}
            width={1280}
            height={720}
            alt={data.title || "Blog image"}
            onError={(e) => {
              e.target.src = '/default-image.png';
            }}
          />
        )}
        <div className="blog-content mt-8 prose prose-lg max-w-none">
          {/* Safe HTML rendering - you might want to use a proper markdown parser */}
          <div
            dangerouslySetInnerHTML={{ 
              __html: data.description?.replace(/\n/g, '<br/>') || '' 
            }}
          />
        </div>
        
        <div className="my-24">
          <p className="text-black font-semibold my-4">
            Share this article on social media
          </p>
          <div className="flex gap-2">
            <Image 
              src={assets.facebook_icon} 
              width={50} 
              alt="Share on Facebook" 
              className="cursor-pointer hover:opacity-80 transition-opacity" 
            />
            <Image 
              src={assets.twitter_icon} 
              width={50} 
              alt="Share on Twitter" 
              className="cursor-pointer hover:opacity-80 transition-opacity" 
            />
            <Image 
              src={assets.googleplus_icon} 
              width={50} 
              alt="Share on Google Plus" 
              className="cursor-pointer hover:opacity-80 transition-opacity" 
            />
          </div>
        </div>
      </div>
      <Footer />
    </>
  ) : (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Blog not found</h2>
        <Link href="/" className="text-blue-500 hover:underline">
          Go Back Home
        </Link>
      </div>
    </div>
  );
};

export default page;
