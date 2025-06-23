import Container from './LandingContainer'
import RegionMap from '@/components/shared/RegionMap'
import { TbCircleCheck } from 'react-icons/tb'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

const mapMeta: Record<string, { img: string }> = {
    us: { img: '/img/countries/US.png' },
    cn: { img: '/img/countries/CN.png' },
    es: { img: '/img/countries/ES.png' },
    sa: { img: '/img/countries/SA.png' },
}

const data = [
    {
        id: 'us',
        name: 'United States',
        value: 38.61,
        coordinates: [-95.7129, 37.0902],
    },
    {
        id: 'es',
        name: 'India',
        value: 26.42,
        coordinates: [-51.9253, -14.235],
    },
    {
        id: 'cn',
        name: 'Brazil',
        value: 32.79,
        coordinates: [78.9629, 20.5937],
    },
    {
        id: 'sa',
        name: 'United Kingdom',
        value: 17.42,
        coordinates: [0.1278, 51.5074],
    },
]

const PointList = ({ children }: { children: ReactNode }) => {
    return (
        <div className="flex items-center gap-2">
            <TbCircleCheck className="text-xl" />
            <span>{children}</span>
        </div>
    )
}

const OtherFeatures = () => {
    return (
        <div id="otherFeatures" className="relative z-20 py-10 md:py-40">
            <Container>
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, type: 'spring', bounce: 0.1 }}
                    viewport={{ once: true }}
                >                    <motion.h2 className="my-6 text-5xl">
                        Built for Project Success
                    </motion.h2>
                    <motion.p className="mx-auto max-w-[600px]">
                        From team collaboration to project tracking, our platform 
                        provides everything you need to deliver projects on time and within budget.
                    </motion.p>
                </motion.div>
                <div className="mt-20">
                    <motion.div
                        className="bg-gray-100 dark:bg-gray-800 rounded-3xl py-12 px-10 lg:py-24 lg:px-16 overflow-hidden mb-10"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.3,
                            type: 'spring',
                            bounce: 0.1,
                        }}
                        viewport={{ once: true }}
                    >
                        <div className="grid lg:grid-cols-2 gap-8 lg:gap-4">                            <div>
                                <h3 className="text-4xl">Team Collaboration</h3>
                                <p className="mt-6 max-w-[550px] text-lg">
                                    Work together seamlessly with role-based access control, 
                                    real-time updates, and integrated communication tools. 
                                    Keep your team aligned and productive throughout the project lifecycle.
                                </p>
                                <div className="mt-12 flex flex-col gap-4">
                                    <PointList>
                                        Real-time collaboration with instant updates
                                        across all team members.
                                    </PointList>
                                    <PointList>
                                        Role-based permissions to control access
                                        to sensitive project information.
                                    </PointList>
                                    <PointList>
                                        Integrated messaging and notification system
                                        for seamless communication.
                                    </PointList>
                                </div>
                            </div>
                            <div className="relative flex justify-center">
                                <motion.div
                                    className="p-2 border border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-700 rounded-[32px] max-w-[300px] lg:absolute lg:top-[-50px]"
                                    whileHover={{ y: -20 }}
                                >
                                    <div className="absolute inset-x-0 bottom-0 h-20 w-full bg-gradient-to-b from-transparent via-gray-100 to-gray-100 dark:via-zinc-800/70 dark:to-gray-800 scale-[1.1] pointer-events-none" />
                                    <div className="bg-white dark:bg-black dark:border-gray-700 border border-gray-200 rounded-[24px] overflow-hidden max-h-[450px]">
                                        <img
                                            src="/img/landing/features/mobile.png"
                                            alt="Mobile view"
                                            className="rounded-[24px]"
                                        />
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        className="bg-gray-100 dark:bg-gray-800 rounded-3xl py-12 px-10 lg:py-24 lg:px-16 overflow-hidden mb-10"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.3,
                            type: 'spring',
                            bounce: 0.1,
                        }}
                        viewport={{ once: true }}
                    >
                        <div className="grid lg:grid-cols-2 gap-8 lg:gap-4">
                            <div className="relative flex justify-center">
                                <div className="lg:absolute h-full w-full left-0 md:left-[-50px] scale-[1.1]">
                                    <RegionMap
                                        data={data}
                                        valueSuffix="%"
                                        hoverable={false}
                                        marker={(Marker) => (
                                            <>
                                                {data.map(
                                                    ({
                                                        name,
                                                        coordinates,
                                                        id,
                                                    }) => (
                                                        <Marker
                                                            key={name}
                                                            coordinates={
                                                                coordinates as [
                                                                    number,
                                                                    number,
                                                                ]
                                                            }
                                                            className="cursor-pointer group"
                                                        >
                                                            <motion.image
                                                                className="shadow-lg"
                                                                href={
                                                                    mapMeta[id]
                                                                        .img
                                                                }
                                                                height="80"
                                                                width="80"
                                                                whileHover={{
                                                                    scale: 1.1,
                                                                }}
                                                            />
                                                        </Marker>
                                                    ),
                                                )}
                                            </>
                                        )}
                                    />
                                </div>
                            </div>                            <div>
                                <h3 className="text-4xl">Project Analytics</h3>
                                <p className="mt-6 max-w-[550px] text-lg">
                                    Gain valuable insights into your project performance with 
                                    comprehensive analytics and reporting. Track progress, 
                                    identify bottlenecks, and make data-driven decisions.
                                </p>
                                <div className="mt-12 flex flex-col gap-4">
                                    <PointList>
                                        Real-time project progress tracking with 
                                        visual charts and graphs.
                                    </PointList>
                                    <PointList>
                                        Team productivity metrics and performance 
                                        analysis across all projects.
                                    </PointList>
                                    <PointList>
                                        Automated reporting with customizable 
                                        dashboards and export options.
                                    </PointList>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div className="bg-gray-100 dark:bg-gray-800 rounded-3xl py-12 px-10 lg:py-24 lg:px-16 overflow-hidden mb-10">
                        <div className="grid lg:grid-cols-2 gap-8 lg:gap-4">                            <div>
                                <h3 className="text-4xl">Advanced Task Management</h3>
                                <p className="mt-6 max-w-[550px] text-lg">
                                    Organize and prioritize tasks with our intuitive task management system. 
                                    From simple to-do lists to complex project workflows, 
                                    manage everything with ease.
                                </p>
                                <div className="mt-12 flex flex-col gap-4">
                                    <PointList>
                                        Drag-and-drop task organization with 
                                        customizable workflows and priorities.
                                    </PointList>
                                    <PointList>
                                        Automated task assignments and deadline 
                                        notifications to keep projects on track.
                                    </PointList>
                                    <PointList>
                                        Advanced filtering and search capabilities 
                                        for quick task discovery and management.
                                    </PointList>
                                </div>
                            </div>
                            <div className="relative flex justify-center">
                                <motion.div
                                    whileHover={{ y: -20 }}
                                    className="relative flex justify-center w-full"
                                >
                                    <div className="p-4 border border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-700 rounded-[32px] max-w-[550px] lg:absolute ">
                                        <div className="absolute inset-x-0 bottom-0 h-20 w-full bg-gradient-to-b from-transparent via-gray-100 to-gray-100 dark:via-zinc-800/50 dark:to-gray-800 scale-[1.1] pointer-events-none" />
                                        <div className="bg-white dark:border-gray-700 border border-gray-200 rounded-[24px] overflow-hidden p-2">
                                            <img
                                                src="/img/landing/features/rtl.png"
                                                alt="App screenshot"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </Container>
        </div>
    )
}

export default OtherFeatures
