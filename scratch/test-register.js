async function run() {
  const res = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: 'test' + Math.random() + '@example.com',
      password: 'password123'
    })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
