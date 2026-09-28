package com.example.studentclient.api

import com.example.studentclient.model.Student
import com.example.studentclient.model.StudentListResponse
import com.example.studentclient.model.StudentSingleResponse
import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

/**
 * Retrofit REST API interface for Student resources.
 */
interface ApiService {

    /**
     * GET /students - Retrieve all enrolled students
     */
    @GET("students")
    fun getAllStudents(): Call<StudentListResponse>

    /**
     * GET /students/{id} - Retrieve single student by ID
     */
    @GET("students/{id}")
    fun getStudentById(@Path("id") id: String): Call<StudentSingleResponse>

    /**
     * POST /students - Register a new student
     */
    @POST("students")
    fun createStudent(@Body student: Student): Call<StudentSingleResponse>
}
