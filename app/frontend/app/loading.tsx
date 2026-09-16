'use client';

import React from 'react'

const Loading = () => {
    return (
        <div className='w-full h-screen flex items-center justify-center' data-testid='loading'>
            <div className='w-[50px] h-[50px] border-2 border-dashed rounded-full border-[#3774E5] animate-spin'></div>
        </div>
    )
}

export default Loading