import IconWrapper from './IconWrapper'
import {
    LuAccessibility,
    LuActivity,
    LuAirVent,
    LuAirplay,
    LuAlarmClock,
    LuAlarmClockOff,
    LuArchive,
    LuArrowRight,
    LuBell,
} from 'react-icons/lu'

const renderIcon = [
    { render: () => <LuAccessibility /> },
    { render: () => <LuActivity /> },
    { render: () => <LuArchive /> },
    { render: () => <LuAirVent /> },
    { render: () => <LuAirplay /> },
    { render: () => <LuArrowRight /> },
    { render: () => <LuAlarmClock /> },
    { render: () => <LuAlarmClockOff /> },
    { render: () => <LuBell /> },
]

const LucideIcons = () => {
    return (
        <div className="grid grid-cols-3 gap-y-6 text-4xl text-center heading-text">
            {renderIcon.map((icon, index) => (
                <IconWrapper key={`icoMoonFree-${index}`}>
                    {icon.render()}
                </IconWrapper>
            ))}
        </div>
    )
}

export default LucideIcons
