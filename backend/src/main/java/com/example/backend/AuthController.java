package com.example.backend;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/signup")
	public ResponseEntity<?> signup(@RequestBody Map<String, String> body) {
		String email = body.get("email");
		String username = body.get("username");
		String password = body.get("password");
		AuthResponse response = new AuthResponse();
		try {
			AppUser user = authService.signup(email, username, password);
			response.setSuccess(true);
			response.setMessage("User created");
			response.setUsername(user.getUsername());
			response.setEmail(user.getEmail());
			return ResponseEntity.ok(response);
		} catch (IllegalArgumentException ex) {
			response.setSuccess(false);
			response.setMessage(ex.getMessage());
			return ResponseEntity.badRequest().body(response);
		}
	}

	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
		String email = body.get("email");
		String password = body.get("password");
		boolean ok = authService.login(email, password);
		AuthResponse response = new AuthResponse();
		response.setSuccess(ok);
		response.setMessage(ok ? "Login successful" : "Invalid credentials");
		response.setEmail(email);
		if (ok) {
			// Get username from database for successful login
			AppUser user = authService.getUserByEmail(email);
			if (user != null) {
				response.setUsername(user.getUsername());
			}
		}
		return ResponseEntity.ok(response);
	}


	static class AuthResponse {
		private boolean success;
		private String message;
		private String username;
		private String email;

		public boolean isSuccess() { return success; }
		public void setSuccess(boolean success) { this.success = success; }
		public String getMessage() { return message; }
		public void setMessage(String message) { this.message = message; }
		public String getUsername() { return username; }
		public void setUsername(String username) { this.username = username; }
		public String getEmail() { return email; }
		public void setEmail(String email) { this.email = email; }
	}
}


