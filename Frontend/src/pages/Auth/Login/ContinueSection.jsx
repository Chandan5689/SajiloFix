import React from 'react'
import { FaTimes } from 'react-icons/fa';
import { FcGoogle } from "react-icons/fc";
import { FaEnvelope } from "react-icons/fa";
import { FaLock } from "react-icons/fa";
import { Link } from 'react-router';
function ContinueSection() {
    return (
        <div>
            <div className="mt-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">
                            Or continue with
                        </span>
                    </div>
                </div>

                <div className="mt-6 grid">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center py-2 px-4 border-2 border-blue-500 shadow-sm text-sm font-medium text-gray-500 hover:bg-blue-50 cursor-pointer rounded-lg"
                    >
                        <FcGoogle className="mr-2 text-xl" />
                        Google
                    </button>
                </div>
            </div>

            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                    Don't have an account?
                    <Link
                        to="/register"
                        className="ml-1 text-blue-600 hover:text-blue-500 font-medium cursor-pointer"
                    >
                        Sign up here
                    </Link>
                </p>
            </div>
        </div>
    );
}
export default ContinueSection;