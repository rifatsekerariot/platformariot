package com.milesight.beaveriot.authentication.util;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;

import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * @author loong
 * @date 2024/10/12 9:18
 */
public class OAuth2EndpointUtils {
    public static MultiValueMap<String, String> getParameters(HttpServletRequest request) {
        Map<String, String[]> parameterMap = request.getParameterMap();
        MultiValueMap<String, String> parameters = new LinkedMultiValueMap(parameterMap.size());
        parameterMap.forEach((key, values) -> {
            if (values.length > 0) {
                String[] var3 = values;
                int var4 = values.length;
                for (int var5 = 0; var5 < var4; ++var5) {
                    String value = var3[var5];
                    parameters.add(key, value);
                }
            }
        });
        return parameters;
    }

    public static OrRequestMatcher getWhiteListMatcher(String[] whiteList) {
        return new OrRequestMatcher(
                Stream.of(whiteList)
                        .map(AntPathRequestMatcher::new)
                        .collect(Collectors.toList())
        );
    }

    /**
     * Request URI ile eşleşen whitelist matcher (proxy/servlet path farkları için yedek).
     * getRequestURI() değeri /api/v1/user/status, /api/v1/user/register, /api/v1/oauth2/token
     * veya /user/status, /user/register, /oauth2/token içeriyorsa eşleşir.
     */
    public static RequestMatcher getWhitelistRequestUriMatcher() {
        return request -> {
            String uri = request != null ? request.getRequestURI() : null;
            if (!StringUtils.hasText(uri)) return false;
            return uri.endsWith("/user/status") || uri.endsWith("/user/register")
                    || uri.contains("/oauth2/token");
        };
    }

    /** Config'den gelen liste + URI yedek matcher (whitelist chain için). */
    public static RequestMatcher getWhitelistMatcherWithFallback(String[] whiteList) {
        RequestMatcher configMatcher = (whiteList != null && whiteList.length > 0)
                ? getWhiteListMatcher(whiteList)
                : request -> false;
        RequestMatcher uriFallback = getWhitelistRequestUriMatcher();
        return request -> configMatcher.matches(request) || uriFallback.matches(request);
    }


    public static void throwError(String errorCode, String description, String errorUri) {
        OAuth2Error error = new OAuth2Error(errorCode, description, errorUri);
        throw new OAuth2AuthenticationException(error);
    }
}
