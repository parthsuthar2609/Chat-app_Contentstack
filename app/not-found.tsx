import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="error-page">
            <h1>404: Not Found</h1>
            <p>You just hit a route that doesn&apos;t exist... the sadness.</p>
            <Link href="/" className="btn primary-btn">
                Back to Home
            </Link>
        </div>
    );
}
