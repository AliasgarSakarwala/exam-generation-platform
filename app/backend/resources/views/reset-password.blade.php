{{-- resources/views/reset-password.blade.php --}}
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Reset Password</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 2rem; background: #f5f5f5; }
    .container { max-width: 400px; margin: 0 auto; background: #fff; padding: 1.5rem; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { font-size: 1.5rem; margin-bottom: 1rem; }
    label { display: block; margin-top: 1rem; font-weight: bold; }
    input[type="email"],
    input[type="password"] { width: 100%; padding: 0.5rem; margin-top: 0.25rem; border: 1px solid #ccc; border-radius: 4px; }
    .error { color: #b00; font-size: 0.9rem; margin-top: 0.25rem; }
    .status { background: #e0ffe0; padding: 0.75rem; border: 1px solid #0a0; border-radius: 4px; margin-bottom: 1rem; }
    button { margin-top: 1.5rem; width: 100%; padding: 0.75rem; background: #3774E5; color: white; border: none; border-radius: 4px; font-size: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Reset Your Password</h1>

    @if (session('status'))
      <div class="status">{{ session('status') }}</div>
    @endif

    @if ($errors->any())
      <div class="error">
        <ul>
          @foreach ($errors->all() as $e)
            <li>{{ $e }}</li>
          @endforeach
        </ul>
      </div>
    @endif

    <form method="POST" action="{{ route('password.update') }}">
      @csrf

      {{-- Reset Token --}}
      <input type="hidden" name="token" value="{{ $token }}">

      {{-- Email Address --}}
      <label for="email">Email Address</label>
      <input
        id="email"
        type="email"
        name="email"
        value="{{ old('email', $email) }}"
        required
        autofocus
      >

      {{-- New Password --}}
      <label for="password">New Password</label>
      <input
        id="password"
        type="password"
        name="password"
        required
      >

      {{-- Confirm Password --}}
      <label for="password_confirmation">Confirm Password</label>
      <input
        id="password_confirmation"
        type="password"
        name="password_confirmation"
        required
      >

      <button type="submit">Reset Password</button>
    </form>
  </div>
</body>
</html>
