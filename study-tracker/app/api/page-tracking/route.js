import { logPageTime } from '@/services/sessionService'


export async function POST(request) {
    const {perviousPage, currentPage, sessionId} = await request.json()
    try{
        const result = await logPageTime({ perviousPage, currentPage, sessionId })
        return Response.json(result)
    }catch(error){
        return Response.json({ error: error.message }, { status: 500 })
    
    
    
    }   


}