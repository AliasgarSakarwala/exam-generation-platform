import React from 'react'
import { BiCheckCircle, BiXCircle } from 'react-icons/bi'

const CreatePasswordHelper = ({ text, satisfied }: { text: string, satisfied: boolean }) => {
    return (
        <div className='flex items-center gap-2' data-testid="password--helper--instruction">
            {satisfied
                ? <BiCheckCircle color='#00a100' className='lg:text-[22px] md:text-[18px] text-[18px]' />
                : <BiXCircle color='rgba(0,0,0,0.4)' className='lg:text-[22px] md:text-[18px] text-[18px]' />}
            <p data-testid="password--helper--instruction--text" className={`${satisfied ? "text-[#00a100]" : "text-[rgba(0,0,0,0.4)]"} lg:text-sm md:text-sm text-xs`}>{text}</p>
        </div>
    )
}

export default CreatePasswordHelper