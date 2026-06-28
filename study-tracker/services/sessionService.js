import {supabase} from '../lib/supabaseClient'

export async function logPageTime({ previousPage, currentPage, timeSpent }) {
  
    const STUCK_THRESHOLD = 300; // 5 minutes in seconds

    const { data, error } =await supabase
        .from('page_tracking')
        .insert(
            {
                session_id: sessionID, 
                page_number: previousPage,
                time_spent_seconds: timeSpent,
                got_stuck: timeSpent >= STUCK_THRESHOLD
            })
            .select().single()

            if (error) throw error

            if (timeSpent >= STUCK_THRESHOLD) {
                // reportservice here 




            }
        return data 

}

// get session ID from supabase auth, complete session, create session, edit session for adding the document.

