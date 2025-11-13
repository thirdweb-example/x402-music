import Head from 'next/head';

export default function TestFrame() {
  return (
    <>
      <Head>
        <title>Test Iframe - x402music.live</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-dark-bg p-8">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-dark-text mb-6">
            Iframe Embed Test
          </h1>
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6 shadow-2xl">
            <div className="inline-block border-2 border-dark-border rounded-xl overflow-hidden shadow-lg">
              <iframe
                src="http://localhost:3000/embed/deee0a86-9735-4b2b-b731-999c022a4d32" 
                width="400"
                height="600"
                frameBorder="0"
                allowTransparency={true}
                className="border-0 block"
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

