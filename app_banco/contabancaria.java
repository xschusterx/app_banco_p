package app_banco;

public class contabancaria 
{
    private String numero;    // usado como String pq vamos usar (.) 
    private String agencia;  // agencia do banco
    private String titular; // titular da conta
    private String tipo;   // tipo de conta corrente ou poupança 
    private double saldo; // double pq usa numero quebrado 0,5  
//    
    public void setNumero (String num) // set para colocar 
    {
//
        // caso precise use o if + linha 81 a 84
        if (num.length() !=9)
        {
            System.out.println("Erro: Quantidade de digitos errado ");
            System.out.println("Reverifique os dados inseridos. ");
        }
        else 
        {
            this.numero = num;
        }
    }
    public String getNumero()      ///get para pegar 
    {
        return this.numero;
    }
//
    public void setAgencia (String ag)  
    {
        if (ag.length() !=7)
        {
            System.out.println("Erro: Quantidade de digitos errado");
            System.out.println("Reverifique os dados inseridos. ");
        }
        else 
        {
            this.agencia = ag;
        }
    }
    public String getAgencia ()
    {
        return this.agencia;
    }
//
    public void setTitular (String ti )  
    {
        if (ti.length() <3)
        {
            System.out.println("verificar nome informado");
        }
        else 
        {
            this.titular = ti;
        }
    }
    public String getTitular()
    {
        return this.titular;
    }
//
    public void setTipo (String tip )  
    {
        if (tip.length() !=8) 
        {
            System.out.println("Erro: Quantidade de digitos errado");    
        }
        else 
        {
            this.tipo = tip;
        }
        
    }
    public String getTipo()
    {
        return this.tipo;
    }
//
    /*  como o double ja atribui como numero não precisa fazer uma verificação se esta correto; 
    caso queira limitar o banco para que não tenha numero negatigo (saldo negativo ex R$-1) pode ser criado um if
    para atribur um limite que seja =>0*/      
    public void setSaldo (double sa )   
    {
        this.saldo = sa;
    }
    public double getSaldo()
    {
        return this.saldo;
    }
    



}
