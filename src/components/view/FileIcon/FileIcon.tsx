'use client'

import FileDoc from '@/assets/svg/files/FileDoc'
import FileXls from '@/assets/svg/files/FileXls'
import FilePdf from '@/assets/svg/files/FilePdf'
import FilePpt from '@/assets/svg/files/FilePpt'
import FileFigma from '@/assets/svg/files/FileFigma'
import FileImage from '@/assets/svg/files/FileImage'
import Folder from '@/assets/svg/files/Folder'
import { 
    PiFileTextDuotone,
    PiFileCodeDuotone,
    PiFileZipDuotone,
    PiFileVideoDuotone,
    PiFileAudioDuotone,
    PiFileCsvDuotone,
    PiVectorThreeDuotone,
    PiCpuDuotone,
    PiFileDuotone,
    PiGearDuotone,
    PiMagicWandDuotone,
    PiPackageDuotone
} from 'react-icons/pi'

const getFileColor = (type: string): string => {
    const colors: { [key: string]: string } = {
        // Documents
        pdf: '#ff4444',
        doc: '#2b5ce6',
        docx: '#2b5ce6', 
        xls: '#1e7b34',
        xlsx: '#1e7b34',
        ppt: '#d04423',
        pptx: '#d04423',
        txt: '#6c757d',
        rtf: '#6c757d',
        csv: '#1e7b34',
        
        // Images
        jpg: '#ffc107',
        jpeg: '#ffc107',
        png: '#17a2b8',
        gif: '#28a745',
        svg: '#fd7e14',
        webp: '#6610f2',
        bmp: '#e83e8c',
        ico: '#20c997',
        
        // Videos
        mp4: '#dc3545',
        avi: '#dc3545',
        mov: '#dc3545',
        mkv: '#dc3545',
        webm: '#dc3545',
        wmv: '#dc3545',
        
        // Audio
        mp3: '#6f42c1',
        wav: '#6f42c1',
        flac: '#6f42c1',
        aac: '#6f42c1',
        ogg: '#6f42c1',
        
        // Code
        js: '#f7df1e',
        ts: '#3178c6',
        jsx: '#61dafb',
        tsx: '#61dafb',
        html: '#e34f26',
        css: '#1572b6',
        scss: '#cf649a',
        sass: '#cf649a',
        json: '#ffd700',
        xml: '#ff8c00',
        py: '#3776ab',
        java: '#ed8b00',
        php: '#777bb4',
        rb: '#cc342d',
        go: '#00add8',
        rs: '#dea584',
        
        // Archives
        zip: '#795548',
        rar: '#795548',
        '7z': '#795548',
        tar: '#795548',
        gz: '#795548',
        
        // Others
        exe: '#607d8b',
        dmg: '#607d8b',
        iso: '#9c27b0',
        sketch: '#ffb300',
        ai: '#ff9800',
        psd: '#31a8ff',
        figma: '#a259ff',
        directory: '#4caf50'
    }
    return colors[type.toLowerCase()] || '#6c757d'
}

const FileIcon = ({ type, size = 40 }: { type: string; size?: number }) => {
    const fileType = type.toLowerCase()
    const color = getFileColor(fileType)
    const iconSize = size
    
    // Premium file types with custom SVG icons
    switch (fileType) {
        case 'pdf':
            return <FilePdf height={size} width={size} />
        case 'xls':
        case 'xlsx':
            return <FileXls height={size} width={size} />
        case 'doc':
        case 'docx':
            return <FileDoc height={size} width={size} />
        case 'ppt':
        case 'pptx':
            return <FilePpt height={size} width={size} />
        case 'figma':
            return <FileFigma height={size} width={size} />
        case 'directory':
            return <Folder height={size} width={size} />
    }
    
    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(fileType)) {
        return <FileImage height={size} width={size} />
    }
    
    // Video files
    if (['mp4', 'avi', 'mov', 'mkv', 'webm', 'wmv', 'flv', 'm4v'].includes(fileType)) {
        return <PiFileVideoDuotone size={iconSize} color={color} />
    }
    
    // Audio files
    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'].includes(fileType)) {
        return <PiFileAudioDuotone size={iconSize} color={color} />
    }
    
    // Code files
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'sass', 'json', 'xml', 'py', 'java', 'php', 'rb', 'go', 'rs', 'c', 'cpp', 'cs', 'swift', 'kt'].includes(fileType)) {
        return <PiFileCodeDuotone size={iconSize} color={color} />
    }
    
    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(fileType)) {
        return <PiFileZipDuotone size={iconSize} color={color} />
    }
    
    // Text files
    if (['txt', 'rtf', 'md', 'csv'].includes(fileType)) {
        return fileType === 'csv' ? <PiFileCsvDuotone size={iconSize} color={color} /> : <PiFileTextDuotone size={iconSize} color={color} />
    }
    
    // Design files
    if (['sketch', 'ai', 'psd', 'xd'].includes(fileType)) {
        return <PiMagicWandDuotone size={iconSize} color={color} />
    }
    
    // 3D files
    if (['obj', 'fbx', 'dae', 'blend', '3ds', 'max'].includes(fileType)) {
        return <PiVectorThreeDuotone size={iconSize} color={color} />
    }
    
    // Executable files
    if (['exe', 'dmg', 'deb', 'rpm', 'msi', 'pkg'].includes(fileType)) {
        return <PiCpuDuotone size={iconSize} color={color} />
    }
    
    // System files
    if (['dll', 'sys', 'ini', 'cfg', 'config'].includes(fileType)) {
        return <PiGearDuotone size={iconSize} color={color} />
    }
    
    // Package files
    if (['npm', 'yarn', 'package', 'bundle'].includes(fileType)) {
        return <PiPackageDuotone size={iconSize} color={color} />
    }
    
    // Default file icon
    return <PiFileDuotone size={iconSize} color={color} />
}

export default FileIcon
export { getFileColor }
