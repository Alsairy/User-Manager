using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using UserManager.Api.Authorization;
using UserManager.Application.Interfaces;
using UserManager.Application.Models.Auth;

namespace UserManager.Api.Controllers;

/// <summary>
/// Handles authentication operations including login, logout, token refresh, and user profile retrieval.
/// </summary>
[ApiController]
[Route("api/v1/auth")]
[Produces("application/json")]
[Tags("Auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ICurrentUser _currentUser;

    /// <summary>
    /// Initializes a new instance of the AuthController.
    /// </summary>
    /// <param name="authService">The authentication service.</param>
    /// <param name="currentUser">The current user accessor.</param>
    public AuthController(IAuthService authService, ICurrentUser currentUser)
    {
        _authService = authService;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Authenticates a user and returns JWT tokens.
    /// </summary>
    /// <remarks>
    /// Sample request:
    ///
    ///     POST /api/v1/auth/login
    ///     {
    ///         "email": "user@example.com",
    ///         "password": "your_password"
    ///     }
    ///
    /// </remarks>
    /// <param name="request">The login credentials containing email and password.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>An AuthResponse containing access token, refresh token, and user information.</returns>
    /// <response code="200">Returns the JWT tokens and user information.</response>
    /// <response code="400">If the request is invalid or credentials are malformed.</response>
    /// <response code="401">If the credentials are invalid or the account is locked.</response>
    /// <response code="429">If too many login attempts have been made (rate limited).</response>
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(request, HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Refreshes an expired access token using a valid refresh token.
    /// </summary>
    /// <remarks>
    /// Sample request:
    ///
    ///     POST /api/v1/auth/refresh
    ///     {
    ///         "refreshToken": "your_refresh_token"
    ///     }
    ///
    /// </remarks>
    /// <param name="request">The refresh request containing the refresh token.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>A new AuthResponse with fresh access and refresh tokens.</returns>
    /// <response code="200">Returns new JWT tokens.</response>
    /// <response code="400">If the request is invalid.</response>
    /// <response code="401">If the refresh token is invalid, expired, or revoked.</response>
    /// <response code="429">If too many refresh attempts have been made (rate limited).</response>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<AuthResponse>> Refresh([FromBody] RefreshRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.RefreshAsync(request, HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Logs out the current user by invalidating the refresh token.
    /// </summary>
    /// <remarks>
    /// This endpoint invalidates the provided refresh token, preventing it from being used for future token refreshes.
    /// The access token will remain valid until it expires.
    ///
    /// Sample request:
    ///
    ///     POST /api/v1/auth/logout
    ///     {
    ///         "refreshToken": "your_refresh_token"
    ///     }
    ///
    /// </remarks>
    /// <param name="request">The logout request containing the refresh token to invalidate.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>No content on successful logout.</returns>
    /// <response code="204">The user was successfully logged out.</response>
    /// <response code="400">If the request is invalid.</response>
    /// <response code="401">If the user is not authenticated.</response>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout([FromBody] RefreshRequest request, CancellationToken cancellationToken)
    {
        await _authService.LogoutAsync(request.RefreshToken, HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Retrieves the profile of the currently authenticated user.
    /// </summary>
    /// <remarks>
    /// Returns detailed information about the authenticated user including their roles and permissions.
    /// Requires a valid JWT token in the Authorization header.
    /// </remarks>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>The user's profile information.</returns>
    /// <response code="200">Returns the user profile.</response>
    /// <response code="401">If the user is not authenticated or the token is invalid.</response>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserProfileResponse>> Me(CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is null)
        {
            return Unauthorized();
        }

        var profile = await _authService.GetProfileAsync(_currentUser.UserId.Value, cancellationToken);
        return Ok(profile);
    }
}
