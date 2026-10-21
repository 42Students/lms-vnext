import React, {useEffect, useState} from "react";
import Api from "@/api/ApiMethod";

function CourseService() {
    const [posts, setPosts] = useState([]);
    useEffect(()=> {
        Api.get("/api/v1/courses/fetch", { params: { deptId: 14 } }).then(res => {
            setPosts(res?.data ?? []);
        })
    }, [])
    return (
        <div>  
            <ul>
               
                    {posts.map(post => <li key={post?.id ?? post?.course_name}>{post?.course_name ?? ""}</li>)}
               
            </ul>

        </div>
    )
}

export default CourseService;
