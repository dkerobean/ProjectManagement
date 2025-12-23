'use client'

import { useState, useRef } from 'react'
import Input from '@/components/ui/Input'
import { TbSearch } from 'react-icons/tb'
import debounce from 'lodash/debounce'

type ClientListSearchProps = {
    onInputChange: (value: string) => void
}

const ClientListSearch = ({ onInputChange }: ClientListSearchProps) => {
    const [value, setValue] = useState('')

    const debouncedOnInputChange = useRef(
        debounce((val: string) => {
            onInputChange(val)
        }, 500),
    ).current

    const handleInputChange = (val: string) => {
        setValue(val)
        debouncedOnInputChange(val)
    }

    return (
        <Input
            ref={null}
            className="max-w-md md:w-52"
            size="sm"
            placeholder="Search clients..."
            prefix={<TbSearch className="text-lg" />}
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
        />
    )
}

export default ClientListSearch
