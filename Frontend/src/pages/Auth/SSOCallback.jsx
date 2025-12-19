// import React, { useEffect } from 'react';
// import { useClerk } from '@clerk/clerk-react';
// import { useNavigate } from 'react-router-dom';


// function SSOCallback() {
//     const { handleRedirectCallback } = useClerk();
//     const navigate = useNavigate();

//     useEffect(() => {
//         const handleCallback = async () => {
//             try {
//                 await handleRedirectCallback();
//                 // After successful OAuth, redirect to phone verification
//                 navigate('/verify-phone-flow');

//             } catch (err) {
//                 console.error('SSO Callback error:', err);
//                 navigate('/login');
//             }
//         };
//         handleCallback();

//     }, [handleRedirectCallback, navigate]);


//     return (
//         <div className="min-h-screen flex items-center justify-center">
//             <div className="text-center">
//                 <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
//                 <p className="text-gray-600">Completing sign in...</p>
//             </div>
//         </div>
//     )
// }

// export default SSOCallback


import React, { useEffect } from 'react';
import { useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

function SSOCallback() {
    const { handleRedirectCallback } = useClerk();
    const navigate = useNavigate();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                await handleRedirectCallback();
                // After successful OAuth, redirect to phone verification
                navigate('/verify-phone-flow');
            } catch (err) {
                console.error('SSO Callback error:', err);
                navigate('/login');
            }
        };

        handleCallback();
    }, [handleRedirectCallback, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Completing sign in...</p>
            </div>
        </div>
    );
}

export default SSOCallback;