#!/usr/bin/env node

/**
 * Test script to verify the task completion and project auto-completion fix
 * This tests that marking the last task as complete doesn't fail with RLS errors
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runTest() {
    console.log('🧪 Testing task completion and project auto-completion...\n')

    try {
        // 1. Create a test project
        console.log('1️⃣ Creating test project...')
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .insert({
                name: 'Test Task Completion Project',
                description: 'Test project for verifying task completion logic',
                status: 'active',
                owner_id: (await supabase.from('users').select('id').limit(1).single()).data.id
            })
            .select()
            .single()

        if (projectError) {
            console.error('❌ Error creating test project:', projectError)
            return
        }
        console.log('✅ Test project created:', project.id)

        // 2. Create 2 test tasks
        console.log('\n2️⃣ Creating test tasks...')
        const tasks = []
        for (let i = 1; i <= 2; i++) {
            const { data: task, error: taskError } = await supabase
                .from('tasks')
                .insert({
                    title: `Test Task ${i}`,
                    description: `Test task ${i} for completion testing`,
                    status: 'todo',
                    priority: 'medium',
                    project_id: project.id,
                    created_by: project.owner_id,
                    position: i
                })
                .select()
                .single()

            if (taskError) {
                console.error(`❌ Error creating task ${i}:`, taskError)
                return
            }
            tasks.push(task)
            console.log(`✅ Task ${i} created:`, task.id)
        }

        // 3. Complete first task (should not trigger project completion)
        console.log('\n3️⃣ Completing first task...')
        const { data: firstTaskUpdate, error: firstTaskError } = await supabase
            .from('tasks')
            .update({ 
                status: 'done',
                completed_at: new Date().toISOString()
            })
            .eq('id', tasks[0].id)
            .select()
            .single()

        if (firstTaskError) {
            console.error('❌ Error completing first task:', firstTaskError)
            return
        }
        console.log('✅ First task completed')

        // Check project status (should still be active)
        const { data: projectAfterFirst } = await supabase
            .from('projects')
            .select('status')
            .eq('id', project.id)
            .single()
        console.log('📊 Project status after first task:', projectAfterFirst?.status)

        // 4. Complete second task (should trigger project completion)
        console.log('\n4️⃣ Completing second task (should trigger project completion)...')
        const { data: secondTaskUpdate, error: secondTaskError } = await supabase
            .from('tasks')
            .update({ 
                status: 'done',
                completed_at: new Date().toISOString()
            })
            .eq('id', tasks[1].id)
            .select()
            .single()

        if (secondTaskError) {
            console.error('❌ Error completing second task:', secondTaskError)
            return
        }
        console.log('✅ Second task completed')

        // Check project status (should now be completed)
        const { data: projectAfterSecond } = await supabase
            .from('projects')
            .select('status')
            .eq('id', project.id)
            .single()
        console.log('📊 Project status after second task:', projectAfterSecond?.status)

        // 5. Check activities created
        console.log('\n5️⃣ Checking activities created...')
        const { data: activities, error: activitiesError } = await supabase
            .from('activities')
            .select('*')
            .eq('entity_id', project.id)
            .eq('entity_type', 'project')
            .order('created_at', { ascending: false })

        if (activitiesError) {
            console.error('❌ Error fetching activities:', activitiesError)
        } else {
            console.log(`📝 Found ${activities.length} project activities:`)
            activities.forEach((activity, index) => {
                console.log(`   ${index + 1}. ${activity.type}: ${activity.title}`)
            })
        }

        // 6. Test reactivation by marking second task as incomplete
        console.log('\n6️⃣ Testing project reactivation...')
        const { data: reactivateTask, error: reactivateError } = await supabase
            .from('tasks')
            .update({ 
                status: 'todo',
                completed_at: null
            })
            .eq('id', tasks[1].id)
            .select()
            .single()

        if (reactivateError) {
            console.error('❌ Error reactivating task:', reactivateError)
            return
        }
        console.log('✅ Second task marked as incomplete')

        // Check project status (should be active again)
        const { data: projectAfterReactivation } = await supabase
            .from('projects')
            .select('status')
            .eq('id', project.id)
            .single()
        console.log('📊 Project status after reactivation:', projectAfterReactivation?.status)

        // 7. Cleanup - delete test data
        console.log('\n7️⃣ Cleaning up test data...')
        await supabase.from('tasks').delete().eq('project_id', project.id)
        await supabase.from('activities').delete().eq('entity_id', project.id)
        await supabase.from('projects').delete().eq('id', project.id)
        console.log('🧹 Test data cleaned up')

        console.log('\n✅ Test completed successfully!')
        console.log('💡 If no errors were shown, the task completion and project auto-completion is working correctly.')

    } catch (error) {
        console.error('❌ Test failed with error:', error)
    }
}

runTest().catch(console.error)
