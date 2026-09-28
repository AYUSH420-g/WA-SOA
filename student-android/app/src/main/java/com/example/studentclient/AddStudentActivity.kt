package com.example.studentclient

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.studentclient.api.RetrofitClient
import com.example.studentclient.databinding.ActivityAddStudentBinding
import com.example.studentclient.model.ErrorResponse
import com.example.studentclient.model.Student
import com.example.studentclient.model.StudentSingleResponse
import com.google.gson.Gson
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class AddStudentActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAddStudentBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAddStudentBinding.inflate(layoutInflater)
        setContentView(binding.root)

        supportActionBar?.title = getString(R.string.title_add_student)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        binding.btnSubmit.setOnClickListener {
            submitStudent()
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }

    private fun submitStudent() {
        val name = binding.etName.text.toString().trim()
        val email = binding.etEmail.text.toString().trim()
        val course = binding.etCourse.text.toString().trim()
        val semesterStr = binding.etSemester.text.toString().trim()

        // Basic client-side validation
        if (name.isEmpty()) {
            binding.tilName.error = "Name is required"
            return
        } else {
            binding.tilName.error = null
        }

        if (email.isEmpty() || !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.tilEmail.error = "Valid email is required"
            return
        } else {
            binding.tilEmail.error = null
        }

        if (course.isEmpty()) {
            binding.tilCourse.error = "Course is required"
            return
        } else {
            binding.tilCourse.error = null
        }

        val semester = semesterStr.toIntOrNull()
        if (semester == null || semester < 1) {
            binding.tilSemester.error = "Semester must be a positive integer"
            return
        } else {
            binding.tilSemester.error = null
        }

        val studentPayload = Student(
            name = name,
            email = email,
            course = course,
            semester = semester
        )

        binding.progressBarAdd.visibility = View.VISIBLE
        binding.btnSubmit.isEnabled = false

        RetrofitClient.instance.createStudent(studentPayload).enqueue(object : Callback<StudentSingleResponse> {
            override fun onResponse(call: Call<StudentSingleResponse>, response: Response<StudentSingleResponse>) {
                binding.progressBarAdd.visibility = View.GONE
                binding.btnSubmit.isEnabled = true

                if (response.code() == 201 || response.isSuccessful) {
                    Toast.makeText(
                        this@AddStudentActivity,
                        "Student added successfully! (201 Created)",
                        Toast.LENGTH_LONG
                    ).show()
                    finish()
                } else if (response.code() == 400) {
                    var errorMsg = "Validation error near the form (400 Bad Request)"
                    try {
                        val errorJson = response.errorBody()?.string()
                        if (!errorJson.isNullOrEmpty()) {
                            val parsedObj = Gson().fromJson(errorJson, ErrorResponse::class.java)
                            if (!parsedObj.message.isNullOrEmpty()) {
                                errorMsg = "400 Bad Request: ${parsedObj.message}"
                            }
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                    Toast.makeText(this@AddStudentActivity, errorMsg, Toast.LENGTH_LONG).show()
                } else {
                    Toast.makeText(
                        this@AddStudentActivity,
                        "Failed: ${response.code()} ${response.message()}",
                        Toast.LENGTH_LONG
                    ).show()
                }
            }

            override fun onFailure(call: Call<StudentSingleResponse>, t: Throwable) {
                binding.progressBarAdd.visibility = View.GONE
                binding.btnSubmit.isEnabled = true
                // Service Contract: 5xx / network issue -> Show Toast: "Something went wrong"
                Toast.makeText(
                    this@AddStudentActivity,
                    "Something went wrong",
                    Toast.LENGTH_LONG
                ).show()
            }
        })
    }
}
