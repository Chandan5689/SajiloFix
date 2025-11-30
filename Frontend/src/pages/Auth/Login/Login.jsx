import React, { useState } from 'react'
import LoginFormLayout from './LoginFormLayout'
import ContinueSection from './ContinueSection'

function Login() {
    const [activeTab, setActiveTab] = useState("Customer")

    return (
        <div>

            <LoginFormLayout activeTab={activeTab} setActiveTab={setActiveTab}>

                {/* RENDER DIFFERENT CONTENT FOR EACH TAB */}
                {activeTab === "Customer" && (
                    <ContinueSection />
                )}

                {activeTab === "Service Provider" && (
                    <ContinueSection />
                )}

                {activeTab === "Admin" && (
                    <div className="text-center text-sm text-gray-600">
                        
                    </div>
                )}

            </LoginFormLayout>

        </div>
    )
}

export default Login