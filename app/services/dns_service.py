import dns.resolver

def get_ips(domain):
    result = dns.resolver.resolve(domain, 'A')
    return [ip.to_text() for ip in result]