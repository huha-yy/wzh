package com.community.tools.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.time.Instant;
import java.util.Date;

@Component
public class JwtTokenProvider {
    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration-minutes}")
    private long expirationMinutes;

    private Key key() {
        byte[] raw;
        try {
            raw = Decoders.BASE64.decode(secret);
        } catch (Exception e) {
            raw = secret.getBytes();
        }
        if (raw.length < 32) {
            try {
                java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
                raw = md.digest(raw);
            } catch (Exception ignored) {
                raw = java.util.Arrays.copyOf(raw, 32);
            }
        }
        return Keys.hmacShaKeyFor(raw);
    }

    public String generate(String subject) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(expirationMinutes * 60);
        return Jwts.builder().setSubject(subject).setIssuedAt(Date.from(now)).setExpiration(Date.from(exp)).signWith(key(), SignatureAlgorithm.HS256).compact();
    }

    public String parse(String token) {
        return Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(token).getBody().getSubject();
    }
}
