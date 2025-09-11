package com.example.backend;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, String> {
	Optional<AppUser> findByUsername(String username);
	Optional<AppUser> findByEmail(String email);
}


